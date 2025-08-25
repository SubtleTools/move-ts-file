import { glob } from 'glob';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import type { ImportTypeInfo } from './types.js';

/**
 * Information about a workspace package
 */
export interface WorkspaceInfo {
  /** The package name (e.g., '@scope/package-name') */
  name: string;
  /** Absolute path to the package root directory */
  root: string;
  /** The parsed package.json content */
  packageJson: any;
}

/**
 * Resolves workspace imports like @scope/package/module to file paths
 * and handles calculating new workspace import paths when files move.
 *
 * In monorepo setups, packages can import from each other using scoped names
 * like '@mycompany/utils/helper'. This resolver maps these imports to actual
 * file paths within the workspace.
 */
export class WorkspaceResolver {
  private workspaces = new Map<string, WorkspaceInfo>();
  private projectRoot: string;

  /**
   * Creates a new workspace resolver
   *
   * @param projectRoot - Absolute path to the project root directory
   */
  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Initialize by discovering all workspace packages
   *
   * Scans the project for package.json files and registers any scoped packages
   * (packages with names starting with '@') as workspace packages.
   *
   * @throws Does not throw but logs information about discovered packages
   *
   * @example
   * ```typescript
   * const resolver = new WorkspaceResolver('/project');
   * await resolver.init();
   * // Console: "Found 3 workspace packages: ['@mycompany/utils', '@mycompany/ui', '@mycompany/core']"
   * ```
   */
  async init(): Promise<void> {
    const packageJsonFiles = await glob('**/package.json', {
      cwd: this.projectRoot,
      ignore: '**/node_modules/**',
    });

    for (const packageFile of packageJsonFiles) {
      try {
        const packagePath = resolve(this.projectRoot, packageFile);
        const packageContent = await readFile(packagePath, 'utf-8');
        const packageJson = JSON.parse(packageContent);

        if (packageJson.name && packageJson.name.startsWith('@')) {
          // This is a scoped package, likely a workspace package
          this.workspaces.set(packageJson.name, {
            name: packageJson.name,
            root: dirname(packagePath),
            packageJson,
          });
        }
      } catch (error) {
        // Ignore invalid package.json files
      }
    }

    console.log(`Found ${this.workspaces.size} workspace packages:`, Array.from(this.workspaces.keys()));
  }

  /**
   * Resolve a workspace import to an absolute file path
   *
   * Takes a workspace import like '@scope/package/module' and resolves it to
   * the actual file path within the workspace. Tries multiple common locations
   * for the module within the package.
   *
   * @param specifier - The workspace import specifier (e.g., '@mycompany/utils/helper')
   * @param fromFile - Absolute path of the file containing the import (unused)
   * @returns Absolute path to the resolved file, or null if not found
   *
   * @example
   * ```typescript
   * const path = resolver.resolveImportPath('@mycompany/utils/helper', '/some/file.ts');
   * // Returns '/project/packages/utils/src/helper.ts' if found
   * ```
   */
  resolveImportPath(specifier: string, fromFile: string): string | null {
    // Check if this looks like a workspace import (e.g., @scope/package/module)
    const match = specifier.match(/^(@[^/]+\/[^/]+)\/(.+)$/);
    if (!match) return null;

    const [, packageName, modulePath] = match;
    const workspace = this.workspaces.get(packageName);
    if (!workspace) return null;

    // Try to resolve the module path within the workspace
    const possiblePaths = [
      join(workspace.root, 'src', modulePath + '.ts'),
      join(workspace.root, 'src', modulePath + '.tsx'),
      join(workspace.root, 'src', modulePath, 'index.ts'),
      join(workspace.root, 'src', modulePath, 'index.tsx'),
      join(workspace.root, modulePath + '.ts'),
      join(workspace.root, modulePath + '.tsx'),
      join(workspace.root, modulePath, 'index.ts'),
      join(workspace.root, modulePath, 'index.tsx'),
    ];

    for (const path of possiblePaths) {
      if (existsSync(path)) {
        return path;
      }
    }

    return null;
  }

  /**
   * Calculate new workspace import path after a file move
   *
   * When a file is moved, this calculates what the new workspace import should be
   * if the file is still within a workspace package. If the file moves outside
   * of any workspace, returns null to indicate a different import strategy is needed.
   *
   * @param oldSpecifier - The original workspace import specifier
   * @param fromFile - Absolute path of the file containing the import (unused)
   * @param newPath - The new absolute path of the moved file
   * @returns New workspace import specifier, or null if file moved outside workspaces
   *
   * @example
   * ```typescript
   * const newPath = resolver.calculateNewImportPath(
   *   '@mycompany/utils/helper',
   *   '/some/file.ts',
   *   '/project/packages/core/src/helper.ts'
   * );
   * // Returns '@mycompany/core/helper'
   * ```
   */
  calculateNewImportPath(oldSpecifier: string, fromFile: string, newPath: string): string | null {
    // Check if this is a workspace import we can handle
    const match = oldSpecifier.match(/^(@[^/]+\/[^/]+)\/(.+)$/);
    if (!match) return null;

    // Find which workspace the NEW path belongs to
    let targetWorkspace: WorkspaceInfo | null = null;
    for (const workspace of this.workspaces.values()) {
      const relativePath = relative(workspace.root, newPath);
      if (!relativePath.startsWith('..') && !relativePath.startsWith('/')) {
        targetWorkspace = workspace;
        break;
      }
    }

    if (!targetWorkspace) {
      // File moved outside of any workspace
      return null;
    }

    // Calculate new module path within the target workspace
    const relativePath = relative(targetWorkspace.root, newPath);
    let newModulePath = relativePath;

    // Remove src/ prefix if present
    if (newModulePath.startsWith('src/')) {
      newModulePath = newModulePath.substring(4);
    }

    // Remove file extension
    newModulePath = newModulePath.replace(/\.(ts|tsx)$/, '');

    // Remove /index suffix
    if (newModulePath.endsWith('/index')) {
      newModulePath = newModulePath.replace(/\/index$/, '');
    }

    return `${targetWorkspace.name}/${newModulePath}`;
  }

  /**
   * Get import type information for workspace imports
   *
   * Determines if an import specifier is a workspace import and provides
   * context information about the import.
   *
   * @param specifier - The import specifier to analyze
   * @param fromFile - Absolute path of the file containing the import (unused)
   * @returns Import type information if it's a workspace import, or null otherwise
   */
  getImportType(specifier: string, fromFile: string): ImportTypeInfo | null {
    if (specifier.match(/^@[^/]+\/[^/]+\//)) {
      return { type: 'workspace', packageName: specifier.split('/').slice(0, 2).join('/') };
    }
    return null;
  }
}
