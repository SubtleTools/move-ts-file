import { existsSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { PathResolver } from './path-resolver.js';
import type { ImportTypeInfo, PackageImportsInfo } from './types.js';

/**
 * Resolves Node.js package imports (subpath imports)
 *
 * Handles imports that start with '#' which are Node.js subpath imports defined
 * in package.json files. These are used for internal module resolution within
 * packages, such as '#internal/utils' mapping to './src/internal/utils.js'.
 */
export class PackageImportsResolver extends PathResolver {
  /**
   * Creates a new package imports resolver
   *
   * @param packageImports - Array of package imports information from package.json files
   */
  constructor(private packageImports: PackageImportsInfo[]) {
    super();
  }

  /**
   * Resolves a package import specifier to an absolute file path
   *
   * @param specifier - The import specifier (must start with '#')
   * @param fromFile - Absolute path of the file containing the import
   * @returns Absolute path of the resolved file, or null if not a package import
   */
  resolveImportPath(specifier: string, fromFile: string): string | null {
    if (!specifier.startsWith('#')) {
      return null;
    }

    // Find the appropriate package.json context
    const packageInfo = this.findPackageImportContext(fromFile);
    if (!packageInfo) return null;

    for (const [importKey, importValue] of packageInfo.imports.entries()) {
      if (this.matchesPackageImport(specifier, importKey)) {
        const resolvedPath = this.resolvePackageImportPath(
          specifier,
          importKey,
          importValue,
          packageInfo.packageRoot,
        );
        if (resolvedPath && existsSync(resolvedPath)) {
          return resolvedPath;
        }
      }
    }

    return null;
  }

  /**
   * Calculates the new package import path when a file is moved
   *
   * @param oldSpecifier - The original import specifier
   * @param fromFile - Absolute path of the file containing the import
   * @param newPath - The new absolute path of the moved file
   * @returns New package import specifier, or null if doesn't fit pattern
   */
  calculateNewImportPath(
    oldSpecifier: string,
    fromFile: string,
    newPath: string,
  ): string | null {
    const packageInfo = this.findPackageImportContext(fromFile);
    if (!packageInfo) return null;

    return this.calculatePackageImportPath(oldSpecifier, newPath, packageInfo);
  }

  /**
   * Determines if an import is a package import
   *
   * @param specifier - The import specifier to analyze
   * @param fromFile - Absolute path of the file containing the import
   * @returns Import type information if it's a package import, or null otherwise
   */
  getImportType(specifier: string, fromFile: string): ImportTypeInfo | null {
    if (specifier.startsWith('#')) {
      const packageInfo = this.findPackageImportContext(fromFile);
      if (packageInfo) {
        return { type: 'package', packageInfo };
      }
    }
    return null;
  }

  /**
   * Finds the package.json context that applies to a file
   *
   * @param fromFile - Absolute path of the file to find context for
   * @returns Package imports info for the closest package.json, or null if none found
   */
  private findPackageImportContext(fromFile: string): PackageImportsInfo | null {
    // Find the closest package.json that contains the fromFile
    for (const packageInfo of this.packageImports) {
      if (fromFile.startsWith(packageInfo.packageRoot)) {
        return packageInfo;
      }
    }
    return null;
  }

  /**
   * Checks if a specifier matches a package import pattern
   *
   * @param specifier - The import specifier to check
   * @param importKey - The import pattern from package.json
   * @returns True if the specifier matches the import pattern
   */
  private matchesPackageImport(specifier: string, importKey: string): boolean {
    if (importKey.endsWith('*')) {
      const pattern = importKey.slice(0, -1);
      return specifier.startsWith(pattern);
    } else {
      return specifier === importKey;
    }
  }

  /**
   * Resolves a package import to an absolute file path
   *
   * @param specifier - The import specifier
   * @param importKey - The matching import key from package.json
   * @param importValue - The import value(s) from package.json
   * @param packageRoot - Root directory of the package
   * @returns Absolute path to the resolved file, or null if not found
   */
  private resolvePackageImportPath(
    specifier: string,
    importKey: string,
    importValue: string | string[],
    packageRoot: string,
  ): string | null {
    const values = Array.isArray(importValue) ? importValue : [importValue];

    for (const value of values) {
      let resolvedPath: string;

      if (importKey.endsWith('*') && value.includes('*')) {
        // Handle wildcard patterns
        const pattern = importKey.slice(0, -1);
        const remainder = specifier.substring(pattern.length);
        resolvedPath = resolve(packageRoot, value.replace('*', remainder));
      } else {
        // Exact match
        resolvedPath = resolve(packageRoot, value);
      }

      const resolved = this.resolveWithExtensions(resolvedPath);
      if (resolved) return resolved;
    }

    return null;
  }

  /**
   * Calculates the new package import path for a moved file
   *
   * @param oldSpecifier - The original import specifier
   * @param newPath - The new absolute path of the moved file
   * @param packageInfo - Package imports information
   * @returns New package import specifier, or null if doesn't fit any pattern
   */
  private calculatePackageImportPath(
    oldSpecifier: string,
    newPath: string,
    packageInfo: PackageImportsInfo,
  ): string | null {
    // For package imports, try to maintain the same import pattern if possible
    for (const [importKey, importValue] of packageInfo.imports.entries()) {
      if (this.matchesPackageImport(oldSpecifier, importKey)) {
        const values = Array.isArray(importValue) ? importValue : [importValue];

        for (const value of values) {
          if (importKey.endsWith('*') && value.includes('*')) {
            // Handle wildcard patterns
            const pattern = importKey.slice(0, -1);

            // Check if the new path still fits within this package import pattern
            const newRelativeFromPackage = relative(packageInfo.packageRoot, newPath).replace(
              /\\/g,
              '/',
            );
            const expectedValuePattern = value.replace('*', '').replace(/\.(js|jsx)$/, '');

            if (newRelativeFromPackage.startsWith(expectedValuePattern)) {
              const newRemainder = newRelativeFromPackage.substring(expectedValuePattern.length);
              return pattern + newRemainder.replace(/\.(ts|tsx)$/, '');
            }
          }
        }
      }
    }

    // If it doesn't fit the package import pattern anymore, return null to fall back
    return null;
  }
}
