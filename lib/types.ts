/**
 * Type definitions for the TypeScript file mover
 */

/**
 * Represents a reference to an import or export statement in a TypeScript file.
 * Used to track import locations for updating when files are moved.
 */
export interface ImportReference {
  /** The import specifier string (e.g., './file', '@/components/Button') */
  specifier: string;
  /** Start position of the import specifier in the source file */
  start: number;
  /** End position of the import specifier in the source file */
  end: number;
  /** Whether this is an export re-export statement */
  isExport: boolean;
  /** New file path after moving (used during update calculation) */
  newPath?: string;
}

/**
 * Represents a file that needs import updates after a TypeScript file is moved.
 * Contains the file content and all import references that need updating.
 */
export interface FileUpdate {
  /** Absolute path to the file that needs updating */
  filePath: string;
  /** Current content of the file */
  content: string;
  /** List of import references in this file that need updating */
  references: ImportReference[];
}

/**
 * Information about a TypeScript path mapping configuration from tsconfig.json.
 * Used to resolve imports that use tsconfig path mappings like '@/components/*'.
 */
export interface PathMappingInfo {
  /** The original alias pattern from tsconfig.json (e.g., '@/components/*') */
  alias: string;
  /** The alias pattern without wildcards (e.g., '@/components/') */
  aliasPattern: string;
  /** The path pattern it maps to (e.g., './src/components/') */
  pathPattern: string;
  /** Absolute base path for resolving relative paths */
  basePath: string;
}

/**
 * Information about Node.js package imports (subpath imports) from package.json.
 * Used to resolve imports that start with '#' like '#internal/utils'.
 */
export interface PackageImportsInfo {
  /** Map of import patterns to their resolved paths */
  imports: Map<string, string | string[]>;
  /** Root directory containing the package.json with imports */
  packageRoot: string;
}

/**
 * Result of analyzing an import specifier to determine its type and context
 */
export interface ImportTypeInfo {
  type: 'tsconfig' | 'package' | 'relative' | 'workspace';
  pathInfo?: PathMappingInfo;
  packageInfo?: PackageImportsInfo;
  packageName?: string; // For workspace imports
}

/**
 * Represents a named export in a barrel file
 */
export interface NamedExport {
  /** The name of the export */
  name: string;
  /** The alias if the export is aliased (e.g., 'as NewName') */
  alias?: string;
}

/**
 * Represents a barrel export (re-export) that would be affected by moving a file
 */
export interface BarrelExport {
  /** Absolute path to the barrel file containing the re-export */
  filePath: string;
  /** The full text of the export declaration */
  exportDeclaration: string;
  /** The module specifier being re-exported from */
  moduleSpecifier: string;
  /** Resolved absolute path of the module being re-exported */
  resolvedPath: string;
  /** Named exports (if any) */
  namedExports: NamedExport[];
  /** Whether this is a star export (export *) */
  hasStarExport: boolean;
  /** Reference to the ts-morph ExportDeclaration node for updating */
  exportDeclarationNode: any; // ts-morph ExportDeclaration
}

/**
 * Result of analyzing barrel exports that would be affected by moving a file
 */
export interface BarrelAnalysisResult {
  /** Barrel exports that directly re-export from the moved file */
  affectedBarrels: BarrelExport[];
  /** Files that transitively import through the affected barrels */
  transitiveImports: string[];
  /** Whether barrel exports need to be updated */
  shouldUpdateBarrels: boolean;
}
