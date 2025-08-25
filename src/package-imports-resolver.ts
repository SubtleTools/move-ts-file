import { existsSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { PathResolver } from './path-resolver.js';
import type { ImportTypeInfo, PackageImportsInfo } from './types.js';

/**
 * Resolves Node.js package imports (subpath imports)
 */
export class PackageImportsResolver extends PathResolver {
  constructor(private packageImports: PackageImportsInfo[]) {
    super();
  }

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

  calculateNewImportPath(
    oldSpecifier: string,
    fromFile: string,
    newPath: string,
  ): string | null {
    const packageInfo = this.findPackageImportContext(fromFile);
    if (!packageInfo) return null;

    return this.calculatePackageImportPath(oldSpecifier, newPath, packageInfo);
  }

  getImportType(specifier: string, fromFile: string): ImportTypeInfo | null {
    if (specifier.startsWith('#')) {
      const packageInfo = this.findPackageImportContext(fromFile);
      if (packageInfo) {
        return { type: 'package', packageInfo };
      }
    }
    return null;
  }

  private findPackageImportContext(fromFile: string): PackageImportsInfo | null {
    // Find the closest package.json that contains the fromFile
    for (const packageInfo of this.packageImports) {
      if (fromFile.startsWith(packageInfo.packageRoot)) {
        return packageInfo;
      }
    }
    return null;
  }

  private matchesPackageImport(specifier: string, importKey: string): boolean {
    if (importKey.endsWith('*')) {
      const pattern = importKey.slice(0, -1);
      return specifier.startsWith(pattern);
    } else {
      return specifier === importKey;
    }
  }

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
