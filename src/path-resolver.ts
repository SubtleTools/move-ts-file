import { existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import type { ImportTypeInfo, PackageImportsInfo, PathMappingInfo } from './types.js';

/**
 * Base class for path resolution strategies
 *
 * Provides a common interface for resolving different types of import paths
 * and calculating new import paths when files are moved.
 */
export abstract class PathResolver {
  /**
   * Resolves an import specifier to an absolute file path
   *
   * @param specifier - The import specifier to resolve (e.g., './file', '@/components/Button')
   * @param fromFile - Absolute path of the file containing the import
   * @returns Absolute path of the resolved file, or null if not resolvable
   */
  abstract resolveImportPath(specifier: string, fromFile: string): string | null;

  /**
   * Calculates the new import path when a file is moved
   *
   * @param oldSpecifier - The original import specifier
   * @param fromFile - Absolute path of the file containing the import
   * @param newPath - The new absolute path of the moved file
   * @returns New import specifier, or null if cannot be calculated
   */
  abstract calculateNewImportPath(
    oldSpecifier: string,
    fromFile: string,
    newPath: string,
  ): string | null;

  /**
   * Determines the type of import and provides context information
   *
   * @param specifier - The import specifier to analyze
   * @param fromFile - Absolute path of the file containing the import
   * @returns Import type information, or null if not handled by this resolver
   */
  abstract getImportType(specifier: string, fromFile: string): ImportTypeInfo | null;

  /**
   * Try resolving a file path with various extensions
   *
   * Attempts to resolve a file by trying different TypeScript and JavaScript extensions,
   * and also looks for index files in directories.
   *
   * @param basePath - The base path to resolve (without extension)
   * @returns Absolute path to the resolved file, or null if not found
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
 *
 * Handles imports that start with './' or '../' and resolves them relative to the importing file.
 */
export class RelativePathResolver extends PathResolver {
  /**
   * Resolves a relative import specifier to an absolute file path
   *
   * @param specifier - The import specifier (must start with '.' or '/')
   * @param fromFile - Absolute path of the file containing the import
   * @returns Absolute path of the resolved file, or null if not relative or not found
   */
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

  /**
   * Calculates the new relative import path when a file is moved
   *
   * @param _oldSpecifier - The original import specifier (unused for relative paths)
   * @param fromFile - Absolute path of the file containing the import
   * @param newPath - The new absolute path of the moved file
   * @returns New relative import specifier
   */
  calculateNewImportPath(
    _oldSpecifier: string,
    fromFile: string,
    newPath: string,
  ): string | null {
    const fromDir = dirname(fromFile);

    // Calculate new relative path from the importing file to the new location
    let newRelativePath = relative(fromDir, newPath);

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

  /**
   * Determines if an import is a relative import
   *
   * @param specifier - The import specifier to analyze
   * @param _fromFile - Absolute path of the file containing the import (unused)
   * @returns Import type information if relative, or null otherwise
   */
  getImportType(specifier: string, _fromFile: string): ImportTypeInfo | null {
    if (specifier.startsWith('.') || specifier.startsWith('/')) {
      return { type: 'relative' };
    }
    return null;
  }
}
