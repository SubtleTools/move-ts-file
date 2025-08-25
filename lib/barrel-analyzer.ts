import { existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { ExportDeclaration, Project, SourceFile, SyntaxKind } from 'ts-morph';
import type { BarrelAnalysisResult, BarrelExport } from './types.js';

/**
 * Analyzes barrel exports (re-exports) in TypeScript files and tracks dependencies.
 *
 * A barrel file is typically an index.ts that re-exports from other modules:
 * ```typescript
 * export { Button } from './components/Button.ts';
 * export * from './utils/helper.ts';
 * export { default as Logger } from './services/logger.ts';
 * ```
 *
 * This analyzer helps detect when moving a file breaks barrel exports and
 * finds all imports that transitively depend on those broken exports.
 */
export class BarrelAnalyzer {
  private project: Project;
  private projectRoot: string;

  /**
   * Creates a new barrel analyzer
   *
   * @param projectRoot - Absolute path to the project root directory
   */
  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;

    const tsConfigPath = resolve(projectRoot, 'tsconfig.json');
    const hasTsConfig = existsSync(tsConfigPath);

    this.project = new Project({
      ...(hasTsConfig && { tsConfigFilePath: tsConfigPath }),
      skipAddingFilesFromTsConfig: true, // We'll add files manually
    });

    // Add all TypeScript files in the project
    this.project.addSourceFilesAtPaths(`${projectRoot}/**/*.{ts,tsx}`);
  }

  /**
   * Analyzes what barrel exports would be affected by moving a file.
   *
   * @param sourcePath - The file being moved (absolute path)
   * @param destPath - The destination path (absolute path)
   * @returns Analysis of affected barrel exports and transitive imports
   */
  async analyzeBarrelImpact(sourcePath: string, destPath: string): Promise<BarrelAnalysisResult> {
    const affectedBarrels: BarrelExport[] = [];
    const transitiveImports: string[] = [];

    // Find all files that re-export from the source file
    const sourceFiles = this.project.getSourceFiles();

    for (const sourceFile of sourceFiles) {
      const barrelExports = this.findBarrelExports(sourceFile, sourcePath);

      if (barrelExports.length > 0) {
        affectedBarrels.push(...barrelExports);

        // Find files that import from this barrel
        const barrelImports = await this.findBarrelImports(sourceFile.getFilePath());
        transitiveImports.push(...barrelImports);
      }
    }

    return {
      affectedBarrels,
      transitiveImports: [...new Set(transitiveImports)], // Remove duplicates
      shouldUpdateBarrels: affectedBarrels.length > 0,
    };
  }

  /**
   * Finds barrel exports in a file that re-export from the specified source path
   *
   * @param sourceFile - The source file to search for barrel exports
   * @param sourcePath - Absolute path of the file being moved
   * @returns Array of barrel exports that re-export from the source path
   */
  private findBarrelExports(sourceFile: SourceFile, sourcePath: string): BarrelExport[] {
    const barrelExports: BarrelExport[] = [];
    const sourceFilePath = sourceFile.getFilePath();

    // Get all export declarations
    const exportDeclarations = sourceFile.getExportDeclarations();

    for (const exportDecl of exportDeclarations) {
      const moduleSpecifier = exportDecl.getModuleSpecifierValue();
      if (!moduleSpecifier) continue;

      // Resolve the module specifier to an absolute path
      const resolvedPath = this.resolveModuleSpecifier(moduleSpecifier, sourceFilePath);

      if (resolvedPath && this.normalizePathForMatching(resolvedPath) === this.normalizePathForMatching(sourcePath)) {
        // This export declaration re-exports from our moved file
        const namedExports = exportDecl.getNamedExports().map(exp => ({
          name: exp.getName(),
          alias: exp.getAliasNode()?.getText(),
        }));

        const hasStarExport = exportDecl.isNamespaceExport();

        barrelExports.push({
          filePath: sourceFilePath,
          exportDeclaration: exportDecl.getText(),
          moduleSpecifier,
          resolvedPath,
          namedExports,
          hasStarExport,
          exportDeclarationNode: exportDecl,
        });
      }
    }

    return barrelExports;
  }

  /**
   * Finds all files that import from the given barrel file
   *
   * @param barrelFilePath - Absolute path to the barrel file
   * @returns Array of file paths that import from the barrel file
   */
  private async findBarrelImports(barrelFilePath: string): Promise<string[]> {
    const imports: string[] = [];
    const sourceFiles = this.project.getSourceFiles();

    for (const sourceFile of sourceFiles) {
      const filePath = sourceFile.getFilePath();
      if (filePath === barrelFilePath) continue;

      // Check all import declarations
      const importDeclarations = sourceFile.getImportDeclarations();

      for (const importDecl of importDeclarations) {
        const moduleSpecifier = importDecl.getModuleSpecifierValue();
        const resolvedPath = this.resolveModuleSpecifier(moduleSpecifier, filePath);

        if (
          resolvedPath && this.normalizePathForMatching(resolvedPath) === this.normalizePathForMatching(barrelFilePath)
        ) {
          imports.push(filePath);
          break; // Found one import from this file, no need to check more
        }
      }
    }

    return imports;
  }

  /**
   * Updates barrel exports after a file has been moved
   *
   * Updates the module specifiers in barrel export statements to point to the
   * new location of the moved file. Saves all modified files to disk.
   *
   * @param barrelExports - The barrel exports to update
   * @param newPath - The new absolute path of the moved file
   * @throws May throw if files cannot be written to disk
   *
   * @example
   * ```typescript
   * const analyzer = new BarrelAnalyzer('/project');
   * const analysis = await analyzer.analyzeBarrelImpact('/old/file.ts', '/new/file.ts');
   * await analyzer.updateBarrelExports(analysis.affectedBarrels, '/new/file.ts');
   * ```
   */
  async updateBarrelExports(barrelExports: BarrelExport[], newPath: string): Promise<void> {
    const updatedFiles = new Set<string>();

    for (const barrelExport of barrelExports) {
      const sourceFile = this.project.getSourceFile(barrelExport.filePath);
      if (!sourceFile) continue;

      // Calculate new module specifier for the moved file
      const newModuleSpecifier = this.calculateNewModuleSpecifier(
        barrelExport.moduleSpecifier,
        barrelExport.filePath,
        newPath,
      );

      // Update the export declaration
      barrelExport.exportDeclarationNode.setModuleSpecifier(newModuleSpecifier);
      updatedFiles.add(barrelExport.filePath);
    }

    // Save all updated files
    for (const filePath of updatedFiles) {
      const sourceFile = this.project.getSourceFile(filePath);
      if (sourceFile) {
        await sourceFile.save();
        console.log(`Updated barrel exports in: ${relative(this.projectRoot, filePath)}`);
      }
    }
  }

  /**
   * Resolves a module specifier to an absolute file path
   *
   * Currently only handles relative imports (starting with '.'), which are
   * the most common in barrel files.
   *
   * @param moduleSpecifier - The module specifier to resolve
   * @param fromFile - Absolute path of the file containing the specifier
   * @returns Absolute path to the resolved file, or null if not resolvable
   */
  private resolveModuleSpecifier(moduleSpecifier: string, fromFile: string): string | null {
    if (moduleSpecifier.startsWith('.')) {
      // Relative import - resolve relative to the file that contains the import
      const resolved = resolve(dirname(fromFile), moduleSpecifier);
      return this.resolveToTsFile(resolved);
    }

    // For non-relative imports, we'd need more sophisticated resolution
    // For now, just handle relative imports which are most common in barrel files
    return null;
  }

  /**
   * Resolves a path to a TypeScript file, trying different extensions
   *
   * Tries various TypeScript and JavaScript extensions and looks for index files.
   *
   * @param basePath - The base path to resolve (without extension)
   * @returns Absolute path to the resolved file, or null if not found
   */
  private resolveToTsFile(basePath: string): string | null {
    // Strip any existing extension first
    const baseWithoutExt = basePath.replace(/\.[jt]sx?$/, '');

    const extensions = ['', '.ts', '.tsx', '/index.ts', '/index.tsx'];

    for (const ext of extensions) {
      const fullPath = baseWithoutExt + ext;
      if (existsSync(fullPath)) {
        return fullPath;
      }
    }

    return null;
  }

  /**
   * Calculates the new module specifier for a barrel export after moving a file
   *
   * Handles relative imports and preserves the original extension style.
   * For non-relative imports, returns the original specifier unchanged.
   *
   * @param oldSpecifier - The original module specifier
   * @param barrelFile - Absolute path to the barrel file
   * @param newPath - The new absolute path of the moved file
   * @returns New module specifier for the moved file
   */
  private calculateNewModuleSpecifier(oldSpecifier: string, barrelFile: string, newPath: string): string {
    if (oldSpecifier.startsWith('.')) {
      // Relative import - calculate new relative path
      let newRelativePath = relative(dirname(barrelFile), newPath);

      // Ensure it starts with './' if it's in the same directory or subdirectory
      if (!newRelativePath.startsWith('.')) {
        newRelativePath = './' + newRelativePath;
      }

      // Preserve the original extension style from the old specifier
      const oldExtMatch = oldSpecifier.match(/\.\w+$/);
      if (oldExtMatch) {
        // Remove any extension from newRelativePath and add the original extension
        newRelativePath = newRelativePath.replace(/\.\w+$/, '') + oldExtMatch[0];
      } else {
        // If original had no extension, remove any extension from the new path too
        newRelativePath = newRelativePath.replace(/\.\w+$/, '');
      }

      return newRelativePath;
    }

    // For non-relative imports, would need more complex logic
    return oldSpecifier;
  }

  /**
   * Normalizes a file path for cross-platform matching
   *
   * Converts backslashes to forward slashes and converts to lowercase
   * for consistent path comparison across different operating systems.
   *
   * @param filePath - The file path to normalize
   * @returns Normalized file path
   */
  private normalizePathForMatching(filePath: string): string {
    return filePath.replace(/\\/g, '/').toLowerCase();
  }
}
