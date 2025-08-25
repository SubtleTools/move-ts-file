import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type { ImportTypeInfo, PackageImportsInfo, PathMappingInfo } from './types.js';

/**
 * Base class for path resolution strategies
 */
export abstract class PathResolver {
  abstract resolveImportPath(specifier: string, fromFile: string): string | null;
  abstract calculateNewImportPath(
    oldSpecifier: string,
    fromFile: string,
    newPath: string,
  ): string | null;
  abstract getImportType(specifier: string, fromFile: string): ImportTypeInfo | null;

  /**
   * Try resolving a file path with various extensions
   */
  protected resolveWithExtensions(basePath: string): string | null {
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];

    // Try exact path first
    if (existsSync(basePath)) {
      return basePath;
    }

    // Try with extensions
    for (const ext of extensions) {
      const pathWithExt = basePath + ext;
      if (existsSync(pathWithExt)) {
        return pathWithExt;
      }
    }

    // Try index files
    for (const ext of extensions) {
      const indexPath = join(basePath, `index${ext}`);
      if (existsSync(indexPath)) {
        return indexPath;
      }
    }

    return null;
  }
}

/**
 * Resolves relative import paths
 */
export class RelativePathResolver extends PathResolver {
  resolveImportPath(specifier: string, fromFile: string): string | null {
    // Skip non-relative imports
    if (!specifier.startsWith('.') && !specifier.startsWith('/')) {
      return null;
    }

    try {
      const fromDir = dirname(fromFile);
      const resolved = resolve(fromDir, specifier);
      return this.resolveWithExtensions(resolved);
    } catch (_error) {
      return null;
    }
  }

  calculateNewImportPath(
    _oldSpecifier: string,
    fromFile: string,
    newPath: string,
  ): string | null {
    const fromDir = dirname(fromFile);

    // Calculate new relative path from the importing file to the new location
    let newRelativePath = require('node:path').relative(fromDir, newPath);

    // Convert Windows backslashes to forward slashes
    newRelativePath = newRelativePath.replace(/\\/g, '/');

    // Remove the .ts/.tsx extension from the import path (TypeScript convention)
    newRelativePath = newRelativePath.replace(/\.(ts|tsx)$/, '');

    // Ensure it starts with ./ or ../
    if (!newRelativePath.startsWith('.')) {
      newRelativePath = `./${newRelativePath}`;
    }

    return newRelativePath;
  }

  getImportType(specifier: string, _fromFile: string): ImportTypeInfo | null {
    if (specifier.startsWith('.') || specifier.startsWith('/')) {
      return { type: 'relative' };
    }
    return null;
  }
}
