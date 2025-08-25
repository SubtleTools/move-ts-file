import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { glob } from 'glob';
import type { ImportTypeInfo } from './types.js';

export interface WorkspaceInfo {
  name: string;
  root: string;
  packageJson: any;
}

/**
 * Resolves workspace imports like @scope/package/module to file paths
 * and handles calculating new workspace import paths when files move.
 */
export class WorkspaceResolver {
  private workspaces = new Map<string, WorkspaceInfo>();
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Initialize by discovering all workspace packages
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
   */
  getImportType(specifier: string, fromFile: string): ImportTypeInfo | null {
    if (specifier.match(/^@[^/]+\/[^/]+\//)) {
      return { type: 'workspace', packageName: specifier.split('/').slice(0, 2).join('/') };
    }
    return null;
  }
}