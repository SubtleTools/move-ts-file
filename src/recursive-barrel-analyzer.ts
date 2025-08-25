import { glob } from 'glob';
import { existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { ExportDeclaration, ImportDeclaration, Project, SourceFile, SyntaxKind } from 'ts-morph';

export interface BarrelReexport {
  /** Path to the barrel file */
  barrelFile: string;
  /** The export declaration that re-exports the moved file */
  exportDeclaration: ExportDeclaration;
  /** Original export statement text */
  exportStatement: string;
  /** Module specifier pointing to the moved file */
  moduleSpecifier: string;
  /** What is being re-exported (named exports or star export) */
  exportType: 'star' | 'named';
  /** Named exports if exportType is 'named' */
  namedExports?: string[];
}

export interface BarrelDependencyGraph {
  /** Map from file path to barrels that re-export it */
  fileToBarrels: Map<string, BarrelReexport[]>;
  /** Map from barrel to its parent barrels (barrels that re-export this barrel) */
  barrelToParents: Map<string, BarrelReexport[]>;
  /** All barrel files in the project */
  barrelFiles: Set<string>;
}

export interface BarrelMoveResult {
  /** Re-exports that will be removed from old barrels */
  removedReexports: BarrelReexport[];
  /** Re-exports that will be added to new barrels */
  addedReexports: BarrelReexport[];
  /** Import updates for files that consume from barrels */
  importUpdates: {
    filePath: string;
    oldImport: string;
    newImport: string;
    importsFromMovedFile: string[];
  }[];
  /** Files that will be modified */
  modifiedFiles: Set<string>;
}

/**
 * Analyzes barrel dependencies recursively and handles complex barrel re-export chains.
 *
 * This analyzer can handle nested barrels (barrels that re-export other barrels)
 * and properly move exports between barrel chains when files are moved.
 */
export class RecursiveBarrelAnalyzer {
  private project: Project;
  private projectRoot: string;
  private dependencyGraph: BarrelDependencyGraph | null = null;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;

    const tsConfigPath = resolve(projectRoot, 'tsconfig.json');
    const hasTsConfig = existsSync(tsConfigPath);

    this.project = new Project({
      ...(hasTsConfig && { tsConfigFilePath: tsConfigPath }),
      skipAddingFilesFromTsConfig: true,
      skipFileDependencyResolution: true, // Skip dependency resolution for performance
    });

    // Don't load all files at once - load on-demand instead
  }

  /**
   * Builds a complete dependency graph of all barrel relationships in the project
   */
  private async buildDependencyGraph(): Promise<BarrelDependencyGraph> {
    if (this.dependencyGraph) {
      return this.dependencyGraph;
    }

    const graph: BarrelDependencyGraph = {
      fileToBarrels: new Map(),
      barrelToParents: new Map(),
      barrelFiles: new Set(),
    };

    // Find all TypeScript files using glob (memory efficient)
    const files = await glob('**/*.{ts,tsx}', {
      cwd: this.projectRoot,
      ignore: '**/node_modules/**',
      absolute: true,
    });

    // First pass: identify all barrel files and their direct re-exports
    for (const filePath of files) {
      // Load this file individually
      const sourceFile = this.project.addSourceFileAtPath(filePath);
      const exportDeclarations = sourceFile.getExportDeclarations();

      if (exportDeclarations.length > 0) {
        // This could be a barrel file
        let isBarrel = false;

        for (const exportDecl of exportDeclarations) {
          const moduleSpecifier = exportDecl.getModuleSpecifierValue();
          if (!moduleSpecifier || !moduleSpecifier.startsWith('.')) continue;

          // Resolve the module specifier
          const resolvedPath = this.resolveModuleSpecifier(moduleSpecifier, filePath);
          if (!resolvedPath) continue;

          isBarrel = true;

          // Create barrel re-export entry
          const reexport: BarrelReexport = {
            barrelFile: filePath,
            exportDeclaration: exportDecl,
            exportStatement: exportDecl.getText(),
            moduleSpecifier,
            exportType: exportDecl.isNamespaceExport() ? 'star' : 'named',
            namedExports: exportDecl.isNamespaceExport()
              ? undefined
              : exportDecl.getNamedExports().map(exp => exp.getName()),
          };

          // Add to file -> barrels mapping
          if (!graph.fileToBarrels.has(resolvedPath)) {
            graph.fileToBarrels.set(resolvedPath, []);
          }
          graph.fileToBarrels.get(resolvedPath)!.push(reexport);
        }

        if (isBarrel) {
          graph.barrelFiles.add(filePath);
        }
      }

      // Remove the file from memory after processing
      this.project.removeSourceFile(sourceFile);
    }

    // Second pass: build barrel -> parent barrel relationships
    for (const barrelFile of graph.barrelFiles) {
      const parentsOfThisBarrel = graph.fileToBarrels.get(barrelFile) || [];
      if (parentsOfThisBarrel.length > 0) {
        graph.barrelToParents.set(barrelFile, parentsOfThisBarrel);
      }
    }

    this.dependencyGraph = graph;
    return graph;
  }

  /**
   * Analyzes what needs to change when moving a file between barrel hierarchies
   */
  async analyzeBarrelMove(sourcePath: string, destPath: string): Promise<BarrelMoveResult> {
    const graph = await this.buildDependencyGraph();

    const result: BarrelMoveResult = {
      removedReexports: [],
      addedReexports: [],
      importUpdates: [],
      modifiedFiles: new Set(),
    };

    // Step 1: Find all barrels that re-export the moved file (recursively)
    const affectedBarrels = this.findBarrelChain(sourcePath, graph);
    result.removedReexports = affectedBarrels;

    // Step 2: Determine new barrel location
    const newBarrelPath = this.findNearestBarrel(destPath);

    // Step 3: Create new re-exports for the new location
    if (newBarrelPath) {
      for (const oldReexport of affectedBarrels) {
        // Create equivalent re-export for the new barrel
        const newReexport: BarrelReexport = {
          ...oldReexport,
          barrelFile: newBarrelPath,
          moduleSpecifier: this.calculateRelativeModuleSpecifier(newBarrelPath, destPath),
        };
        result.addedReexports.push(newReexport);
      }
    }

    // Step 4: Find all imports that consume from these barrels and update them
    result.importUpdates = await this.findAndUpdateBarrelConsumers(
      affectedBarrels,
      sourcePath,
      destPath,
      newBarrelPath,
    );

    // Step 5: Collect all files that will be modified
    for (const reexport of result.removedReexports) {
      result.modifiedFiles.add(reexport.barrelFile);
    }
    for (const reexport of result.addedReexports) {
      result.modifiedFiles.add(reexport.barrelFile);
    }
    for (const update of result.importUpdates) {
      result.modifiedFiles.add(update.filePath);
    }

    return result;
  }

  /**
   * Finds all barrels in the chain that re-export the given file (recursively)
   */
  private findBarrelChain(filePath: string, graph: BarrelDependencyGraph): BarrelReexport[] {
    const visited = new Set<string>();
    const result: BarrelReexport[] = [];

    const findRecursive = (currentPath: string) => {
      if (visited.has(currentPath)) return;
      visited.add(currentPath);

      const directBarrels = graph.fileToBarrels.get(currentPath) || [];
      result.push(...directBarrels);

      // Recursively find barrels that re-export these barrels
      for (const barrel of directBarrels) {
        findRecursive(barrel.barrelFile);
      }
    };

    findRecursive(filePath);
    return result;
  }

  /**
   * Finds the nearest index.ts file in the destination directory or parent directories
   */
  private findNearestBarrel(filePath: string): string | null {
    let currentDir = dirname(filePath);
    const projectRootNormalized = resolve(this.projectRoot);

    while (currentDir.startsWith(projectRootNormalized)) {
      const indexPath = join(currentDir, 'index.ts');
      if (existsSync(indexPath)) {
        return indexPath;
      }

      const indexTsxPath = join(currentDir, 'index.tsx');
      if (existsSync(indexTsxPath)) {
        return indexTsxPath;
      }

      const parentDir = dirname(currentDir);
      if (parentDir === currentDir) break;
      currentDir = parentDir;
    }

    return null;
  }

  /**
   * Finds all files that import from the affected barrels and determines how to update them
   */
  private async findAndUpdateBarrelConsumers(
    affectedBarrels: BarrelReexport[],
    sourcePath: string,
    destPath: string,
    newBarrelPath: string | null,
  ): Promise<BarrelMoveResult['importUpdates']> {
    const updates: BarrelMoveResult['importUpdates'] = [];

    // Get exports from the moved file to know what to look for
    const movedFileExports = this.getFileExports(sourcePath);

    // Find all TypeScript files using glob (memory efficient)
    const files = await glob('**/*.{ts,tsx}', {
      cwd: this.projectRoot,
      ignore: '**/node_modules/**',
      absolute: true,
    });

    // Process each file on-demand to check if it imports from affected barrels
    for (const filePath of files) {
      // Load this file individually
      const sourceFile = this.project.addSourceFileAtPath(filePath);
      const importDeclarations = sourceFile.getImportDeclarations();

      for (const importDecl of importDeclarations) {
        const moduleSpecifier = importDecl.getModuleSpecifierValue();
        const resolvedImportPath = this.resolveModuleSpecifier(moduleSpecifier, filePath);

        // Check if this import is from one of the affected barrels
        const affectedBarrel = affectedBarrels.find(barrel =>
          this.normalizePathForMatching(resolvedImportPath)
            === this.normalizePathForMatching(barrel.barrelFile)
        );

        if (affectedBarrel) {
          // This import is from an affected barrel
          const importedNames = this.getImportedNames(importDecl);
          const importsFromMovedFile = importedNames.filter(name => movedFileExports.includes(name));

          if (importsFromMovedFile.length > 0) {
            // This import uses exports from the moved file
            const newImportPath = newBarrelPath
              ? this.calculateRelativeModuleSpecifier(filePath, newBarrelPath)
              : this.calculateRelativeModuleSpecifier(filePath, destPath);

            updates.push({
              filePath,
              oldImport: importDecl.getText(),
              newImport: this.createNewImportStatement(importDecl, importsFromMovedFile, newImportPath),
              importsFromMovedFile,
            });
          }
        }
      }

      // Remove the file from memory after processing
      this.project.removeSourceFile(sourceFile);
    }

    return updates;
  }

  /**
   * Gets all exported names from a TypeScript file
   */
  private getFileExports(filePath: string): string[] {
    const sourceFile = this.project.getSourceFile(filePath);
    if (!sourceFile) return [];

    const exports: string[] = [];

    // Get named exports
    const exportDeclarations = sourceFile.getExportDeclarations();
    for (const exportDecl of exportDeclarations) {
      if (!exportDecl.getModuleSpecifierValue()) {
        // This is a re-export of local declarations
        const namedExports = exportDecl.getNamedExports();
        for (const namedExport of namedExports) {
          exports.push(namedExport.getName());
        }
      }
    }

    // Get function/variable/class exports
    const exportedDeclarations = sourceFile.getExportedDeclarations();
    for (const [name] of exportedDeclarations) {
      if (name !== 'default') {
        exports.push(name);
      }
    }

    return exports;
  }

  /**
   * Gets imported names from an import declaration
   */
  private getImportedNames(importDecl: ImportDeclaration): string[] {
    const names: string[] = [];

    // Named imports
    const namedImports = importDecl.getNamedImports();
    for (const namedImport of namedImports) {
      names.push(namedImport.getName());
    }

    // Default import
    const defaultImport = importDecl.getDefaultImport();
    if (defaultImport) {
      names.push('default');
    }

    // Namespace import
    const namespaceImport = importDecl.getNamespaceImport();
    if (namespaceImport) {
      // For namespace imports, we can't easily determine what's used
      // This would require more sophisticated analysis
      names.push('*');
    }

    return names;
  }

  /**
   * Creates a new import statement with the specified imports and module path
   */
  private createNewImportStatement(
    originalImport: ImportDeclaration,
    importsFromMovedFile: string[],
    newModulePath: string,
  ): string {
    // For now, create a simple named import
    // TODO: Handle default imports, namespace imports, etc.
    const importNames = importsFromMovedFile.join(', ');
    return `import { ${importNames} } from '${newModulePath}';`;
  }

  /**
   * Calculates a relative module specifier from one file to another
   */
  private calculateRelativeModuleSpecifier(fromFile: string, toFile: string): string {
    let relativePath = relative(dirname(fromFile), toFile);

    // Remove file extension
    relativePath = relativePath.replace(/\.(ts|tsx|js|jsx)$/, '');

    // Ensure it starts with './' if it's in the same directory or subdirectory
    if (!relativePath.startsWith('.')) {
      relativePath = './' + relativePath;
    }

    // Add .js extension (TypeScript convention)
    if (!relativePath.endsWith('.js')) {
      relativePath += '.js';
    }

    return relativePath;
  }

  /**
   * Resolves a module specifier to an absolute file path
   */
  private resolveModuleSpecifier(moduleSpecifier: string, fromFile: string): string | null {
    if (moduleSpecifier.startsWith('.')) {
      // Relative import
      const resolved = resolve(dirname(fromFile), moduleSpecifier);
      return this.resolveToTsFile(resolved);
    }

    // For non-relative imports, we'd need more sophisticated resolution
    return null;
  }

  /**
   * Resolves a path to a TypeScript file, trying different extensions
   */
  private resolveToTsFile(basePath: string): string | null {
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
   * Normalizes a file path for cross-platform matching
   */
  private normalizePathForMatching(filePath: string | null): string {
    return filePath ? filePath.replace(/\\/g, '/').toLowerCase() : '';
  }
}
