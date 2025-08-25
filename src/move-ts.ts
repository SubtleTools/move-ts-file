#!/usr/bin/env node
/* biome-ignore assist/source/organizeImports: Keep imports in dprint order */
import { glob } from 'glob';
import { existsSync, renameSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, isAbsolute, relative, resolve } from 'node:path';
import { BarrelAnalyzer } from './barrel-analyzer.js';
import { ConfigLoader } from './config-loader.js';
import { ImportAnalyzer } from './import-analyzer.js';
import { PackageImportsResolver } from './package-imports-resolver.js';
import { RelativePathResolver } from './path-resolver.js';
import { TsConfigPathResolver } from './tsconfig-path-resolver.js';
import type {
  BarrelAnalysisResult,
  FileUpdate,
  ImportReference,
  ImportTypeInfo,
  PackageImportsInfo,
  PathMappingInfo,
} from './types.js';
import { WorkspaceResolver } from './workspace-resolver.js';

/**
 * A powerful TypeScript file mover that intelligently handles import path updates.
 *
 * This class provides functionality to move TypeScript files while automatically
 * finding and updating all import statements that reference the moved file throughout
 * the entire project. It supports multiple import resolution strategies including:
 *
 * - Relative imports (e.g., './file', '../utils/helper')
 * - TypeScript path mappings from tsconfig.json (e.g., '@/components/Button')
 * - Node.js package imports/subpath imports (e.g., '#internal/utils')
 * - Complex monorepo structures with multiple tsconfig files
 *
 * The tool preserves the original import style when possible and falls back to
 * relative imports when the original pattern can no longer be maintained.
 *
 * @example
 * ```typescript
 * const mover = new TypeScriptFileMover('/path/to/project');
 * await mover.init();
 * await mover.moveFile('src/old-location.ts', 'src/new-location.ts');
 * ```
 */
export interface TypeScriptFileMoverOptions {
  /** Whether to update barrel exports (re-exports) when moving files (default: true) */
  updateBarrels?: boolean;
}

export class TypeScriptFileMover {
  /** Root directory of the TypeScript project */
  private projectRoot: string;
  /** Configuration options */
  private options: TypeScriptFileMoverOptions;
  /** Configuration loader */
  private configLoader: ConfigLoader;
  /** Import analyzer */
  private importAnalyzer: ImportAnalyzer;
  /** Barrel export analyzer */
  private barrelAnalyzer?: BarrelAnalyzer;
  /** Path resolvers */
  private tsConfigResolver?: TsConfigPathResolver;
  private packageImportsResolver?: PackageImportsResolver;
  private workspaceResolver?: WorkspaceResolver;
  private relativeResolver: RelativePathResolver;

  /**
   * Creates a new TypeScript file mover instance.
   *
   * @param projectRoot - Root directory of the TypeScript project. Defaults to current working directory.
   * @param options - Configuration options for the file mover
   */
  constructor(projectRoot: string = process.cwd(), options: TypeScriptFileMoverOptions = {}) {
    this.projectRoot = projectRoot;
    // Default updateBarrels to true if not explicitly specified
    this.options = { updateBarrels: true, ...options };
    this.configLoader = new ConfigLoader(projectRoot);
    this.importAnalyzer = new ImportAnalyzer();
    this.relativeResolver = new RelativePathResolver();

    // Initialize barrel analyzer if requested
    if (this.options.updateBarrels) {
      this.barrelAnalyzer = new BarrelAnalyzer(projectRoot);
    }
  }

  /**
   * Initializes the TypeScript file mover by loading configuration from tsconfig.json
   * and package.json files throughout the project.
   *
   * This method must be called before using moveFile(). It scans for all tsconfig.json
   * and package.json files in the project to understand path mappings and import configurations.
   *
   * @throws {Error} If configuration files cannot be parsed
   */
  async init(): Promise<void> {
    const [tsConfigPaths, packageImports] = await Promise.all([
      this.configLoader.loadTsConfigPaths(),
      this.configLoader.loadPackageImports(),
    ]);

    if (tsConfigPaths.size > 0) {
      this.tsConfigResolver = new TsConfigPathResolver(tsConfigPaths);
    }

    if (packageImports.length > 0) {
      this.packageImportsResolver = new PackageImportsResolver(packageImports);
    }

    // Always initialize workspace resolver
    this.workspaceResolver = new WorkspaceResolver(this.projectRoot);
    await this.workspaceResolver.init();
  }

  /**
   * Moves a TypeScript file and automatically updates all import paths throughout the project.
   *
   * This is the main method that orchestrates the entire file moving process:
   * 1. Validates the source file exists and is a TypeScript file
   * 2. Finds all files in the project that import the source file
   * 3. Moves the source file to the destination
   * 4. Updates all import statements to point to the new location
   * 5. Reports which files were updated
   *
   * @param sourcePath - Path to the source TypeScript file to move (relative to project root)
   * @param destPath - Path to the destination location (relative to project root)
   *
   * @throws {Error} If source file doesn't exist, isn't a TypeScript file, or destination already exists
   *
   * @example
   * ```typescript
   * await mover.moveFile('src/utils/helper.ts', 'src/lib/helper.ts');
   * ```
   */
  async moveFile(sourcePath: string, destPath: string): Promise<void> {
    const resolvedSource = resolve(this.projectRoot, sourcePath);
    const resolvedDest = this.resolveDestination(destPath);

    // Validate source file exists
    if (!existsSync(resolvedSource)) {
      throw new Error(`Source file does not exist: ${sourcePath}`);
    }

    // Validate it's a TypeScript file
    if (!['.ts', '.tsx'].includes(extname(resolvedSource))) {
      throw new Error(`Source must be a TypeScript file (.ts or .tsx): ${sourcePath}`);
    }

    // Check if destination already exists
    if (existsSync(resolvedDest)) {
      throw new Error(`Destination already exists: ${resolvedDest}`);
    }

    // Create destination directory if needed
    await mkdir(dirname(resolvedDest), { recursive: true });

    console.log(`Moving ${sourcePath} to ${resolvedDest}`);

    // Find all files that might import this file
    const affectedFiles = await this.findAffectedFiles(resolvedSource);

    // Calculate the old and new import paths
    const updates = await this.calculateImportUpdates(resolvedSource, resolvedDest, affectedFiles);

    // Analyze barrel exports BEFORE moving the file
    let barrelAnalysis: BarrelAnalysisResult | null = null;
    if (this.barrelAnalyzer) {
      barrelAnalysis = await this.barrelAnalyzer.analyzeBarrelImpact(resolvedSource, resolvedDest);
    }

    // Move the file
    renameSync(resolvedSource, resolvedDest);

    // Update all import statements
    await this.updateImportStatements(updates);

    // Handle barrel exports if enabled
    let barrelUpdatesCount = 0;
    if (this.barrelAnalyzer && barrelAnalysis && barrelAnalysis.shouldUpdateBarrels) {
      await this.barrelAnalyzer.updateBarrelExports(barrelAnalysis.affectedBarrels, resolvedDest);
      barrelUpdatesCount = barrelAnalysis.affectedBarrels.length;
    }

    const totalUpdates = updates.length + barrelUpdatesCount;
    console.log(`Successfully moved file and updated ${totalUpdates} files with import changes`);
  }

  private resolveDestination(destPath: string): string {
    if (isAbsolute(destPath)) {
      return destPath;
    }

    const resolvedDest = resolve(this.projectRoot, destPath);

    // If destPath is a directory, keep the original filename
    if (destPath.endsWith('/') || (!extname(destPath) && !destPath.includes('.'))) {
      // It's a directory - we need the source filename
      throw new Error(
        'Destination directory specified, but source filename is needed. Use: move-ts.ts <source> <dest-dir/filename.ts>',
      );
    }

    return resolvedDest;
  }

  /**
   * Finds all TypeScript files in the project that import the specified source file.
   *
   * Uses TypeScript AST parsing to analyze import statements in all .ts and .tsx files,
   * resolving each import to determine if it references the source file.
   *
   * @param sourcePath - Absolute path to the source file to find references for
   * @returns Array of absolute file paths that import the source file
   *
   * @private
   */
  private async findAffectedFiles(sourcePath: string): Promise<string[]> {
    const files = await glob('**/*.{ts,tsx}', {
      cwd: this.projectRoot,
      ignore: '**/node_modules/**',
      absolute: true,
    });

    const affectedFiles: string[] = [];
    const sourcePathForMatching = this.normalizePathForMatching(sourcePath);

    for (const file of files) {
      if (file === sourcePath) continue;

      const imports = await this.importAnalyzer.analyzeFile(file);

      for (const imp of imports) {
        const resolvedImport = this.resolveImportPath(imp.specifier, file);
        if (resolvedImport && this.normalizePathForMatching(resolvedImport) === sourcePathForMatching) {
          affectedFiles.push(file);
          break;
        }
      }
    }

    return affectedFiles;
  }

  private normalizePathForMatching(filePath: string): string {
    return filePath.replace(/\\/g, '/').toLowerCase();
  }

  /**
   * Resolves an import specifier to its absolute file path using multiple strategies.
   */
  private resolveImportPath(specifier: string, fromFile: string): string | null {
    // Try different resolution strategies in order of priority

    // 1. Try workspace imports (highest priority for monorepos)
    if (this.workspaceResolver) {
      const resolved = this.workspaceResolver.resolveImportPath(specifier, fromFile);
      if (resolved) return resolved;
    }

    // 2. Try TypeScript path mapping
    if (this.tsConfigResolver) {
      const resolved = this.tsConfigResolver.resolveImportPath(specifier, fromFile);
      if (resolved) return resolved;
    }

    // 3. Try package.json imports
    if (this.packageImportsResolver) {
      const resolved = this.packageImportsResolver.resolveImportPath(specifier, fromFile);
      if (resolved) return resolved;
    }

    // 4. Try relative imports
    return this.relativeResolver.resolveImportPath(specifier, fromFile);
  }

  /**
   * Calculates what import updates are needed for each affected file after moving a source file.
   *
   * Analyzes each affected file to determine which imports reference the moved file
   * and prepares the data needed to update those imports to point to the new location.
   *
   * @param oldPath - Original absolute path of the moved file
   * @param newPath - New absolute path of the moved file
   * @param affectedFiles - List of files that import the moved file
   * @returns Array of file updates with import changes needed
   *
   * @private
   */
  private async calculateImportUpdates(
    oldPath: string,
    newPath: string,
    affectedFiles: string[],
  ): Promise<FileUpdate[]> {
    const updates: FileUpdate[] = [];

    for (const file of affectedFiles) {
      try {
        const content = await readFile(file, 'utf-8');
        const sourceFile = this.importAnalyzer.createSourceFile(file, content);
        const imports = this.importAnalyzer.extractImports(sourceFile);

        const relevantImports = imports.filter(imp => {
          const resolvedImport = this.resolveImportPath(imp.specifier, file);
          return (
            resolvedImport && this.normalizePathForMatching(resolvedImport) === this.normalizePathForMatching(oldPath)
          );
        });

        if (relevantImports.length > 0) {
          updates.push({
            filePath: file,
            content,
            references: relevantImports.map(ref => ({
              ...ref,
              newPath: newPath,
            })),
          });
        }
      } catch (error) {
        console.warn(`Failed to analyze ${file}:`, error);
      }
    }

    return updates;
  }

  /**
   * Updates import statements in all affected files by replacing old import paths with new ones.
   *
   * Processes each file update by replacing import specifiers in-place and writing
   * the updated content back to disk. Updates are applied in reverse order by position
   * to maintain correct string indices.
   *
   * @param updates - Array of file updates to apply
   *
   * @private
   */
  private async updateImportStatements(updates: FileUpdate[]): Promise<void> {
    for (const update of updates) {
      try {
        let content = update.content;
        const sortedReferences = [...update.references].sort((a, b) => b.start - a.start);

        for (const ref of sortedReferences) {
          const newImportPath = this.calculateNewImportPath(ref.specifier, update.filePath, ref);
          content = content.substring(0, ref.start + 1) + newImportPath + content.substring(ref.end - 1);
        }

        await writeFile(update.filePath, content, 'utf-8');
        console.log(`Updated imports in: ${relative(this.projectRoot, update.filePath)}`);
      } catch (error) {
        console.error(`Failed to update ${update.filePath}:`, error);
      }
    }
  }

  private calculateNewImportPath(oldSpecifier: string, fromFile: string, reference: ImportReference): string {
    if (!reference.newPath) {
      return oldSpecifier;
    }

    // Try each resolver in priority order
    if (this.workspaceResolver) {
      const newPath = this.workspaceResolver.calculateNewImportPath(oldSpecifier, fromFile, reference.newPath);
      if (newPath) return newPath;
    }

    if (this.tsConfigResolver) {
      const newPath = this.tsConfigResolver.calculateNewImportPath(oldSpecifier, fromFile, reference.newPath);
      if (newPath) return newPath;
    }

    if (this.packageImportsResolver) {
      const newPath = this.packageImportsResolver.calculateNewImportPath(oldSpecifier, fromFile, reference.newPath);
      if (newPath) return newPath;
    }

    // Fall back to relative import
    return this.relativeResolver.calculateNewImportPath(oldSpecifier, fromFile, reference.newPath) || oldSpecifier;
  }

  private getImportType(specifier: string, fromFile: string): ImportTypeInfo {
    // Try each resolver to determine import type
    if (this.workspaceResolver) {
      const importType = this.workspaceResolver.getImportType(specifier, fromFile);
      if (importType) return importType;
    }

    if (this.tsConfigResolver) {
      const importType = this.tsConfigResolver.getImportType(specifier, fromFile);
      if (importType) return importType;
    }

    if (this.packageImportsResolver) {
      const importType = this.packageImportsResolver.getImportType(specifier, fromFile);
      if (importType) return importType;
    }

    return this.relativeResolver.getImportType(specifier, fromFile) || { type: 'relative' };
  }
}

/**
 * Main CLI entry point that processes command line arguments and executes the file move operation.
 *
 * Validates command line arguments, creates a TypeScriptFileMover instance, and performs
 * the file move operation with proper error handling and user feedback.
 *
 * @example
 * ```bash
 * move-ts-file src/old-file.ts src/new-location/
 * move-ts-file components/Button.tsx shared/ui/Button.tsx
 * ```
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Parse flags and arguments
  const flags = args.filter(arg => arg.startsWith('--'));
  const positionalArgs = args.filter(arg => !arg.startsWith('--'));

  if (positionalArgs.length !== 2) {
    console.error('Usage: move-ts <source-file> <destination> [options]');
    console.error('');
    console.error('Options:');
    console.error('  --no-update-barrels    Disable automatic barrel export updates (default: enabled)');
    console.error('');
    console.error('Examples:');
    console.error('  move-ts src/old-file.ts src/new-location/');
    console.error('  move-ts src/old-file.ts src/new-location/new-name.ts');
    console.error('  move-ts components/Button.tsx shared/ui/Button.tsx');
    console.error('  move-ts src/utils/helper.ts src/lib/helper.ts --no-update-barrels');
    process.exit(1);
  }

  const [sourcePath, destPath] = positionalArgs;

  // Parse options (default to true for updateBarrels)
  const updateBarrels = !flags.includes('--no-update-barrels');

  try {
    const mover = new TypeScriptFileMover(process.cwd(), { updateBarrels });
    await mover.init();
    await mover.moveFile(sourcePath, destPath);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Export the class for programmatic usage (already handled by export above)

// Check if this file is being run directly (using import.meta for ES modules)
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
