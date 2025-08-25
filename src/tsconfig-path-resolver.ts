import { existsSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { PathResolver } from './path-resolver.js';
import type { ImportTypeInfo, PathMappingInfo } from './types.js';

/**
 * Resolves TypeScript config path mappings
 */
export class TsConfigPathResolver extends PathResolver {
  constructor(private tsConfigPaths: Map<string, PathMappingInfo[]>) {
    super();
  }

  resolveImportPath(specifier: string, _fromFile: string): string | null {
    for (const [_alias, pathInfos] of this.tsConfigPaths.entries()) {
      for (const pathInfo of pathInfos) {
        if (this.matchesAlias(specifier, pathInfo)) {
          const resolvedPath = this.resolveTsPath(specifier, pathInfo);
          if (resolvedPath && existsSync(resolvedPath)) {
            return resolvedPath;
          }
        }
      }
    }
    return null;
  }

  calculateNewImportPath(
    oldSpecifier: string,
    _fromFile: string,
    newPath: string,
  ): string | null {
    const pathInfo = this.findMatchingPathInfo(oldSpecifier);
    if (!pathInfo) return null;

    return this.calculateTsConfigImportPath(oldSpecifier, newPath, pathInfo);
  }

  getImportType(specifier: string, _fromFile: string): ImportTypeInfo | null {
    for (const [_alias, pathInfos] of this.tsConfigPaths.entries()) {
      for (const pathInfo of pathInfos) {
        if (this.matchesAlias(specifier, pathInfo)) {
          return { type: 'tsconfig', pathInfo };
        }
      }
    }
    return null;
  }

  private matchesAlias(specifier: string, pathInfo: PathMappingInfo): boolean {
    if (pathInfo.alias.endsWith('*')) {
      return specifier.startsWith(pathInfo.aliasPattern);
    } else {
      return specifier === pathInfo.aliasPattern;
    }
  }

  private resolveTsPath(specifier: string, pathInfo: PathMappingInfo): string | null {
    let resolvedPath: string;

    if (pathInfo.alias.endsWith('*')) {
      // Handle wildcard patterns
      const remainder = specifier.substring(pathInfo.aliasPattern.length);
      resolvedPath = resolve(pathInfo.basePath, pathInfo.pathPattern + remainder);
    } else {
      // Exact match
      resolvedPath = resolve(pathInfo.basePath, pathInfo.pathPattern);
    }

    return this.resolveWithExtensions(resolvedPath);
  }

  private findMatchingPathInfo(specifier: string): PathMappingInfo | null {
    for (const [_alias, pathInfos] of this.tsConfigPaths.entries()) {
      for (const pathInfo of pathInfos) {
        if (this.matchesAlias(specifier, pathInfo)) {
          return pathInfo;
        }
      }
    }
    return null;
  }

  private calculateTsConfigImportPath(
    oldSpecifier: string,
    newPath: string,
    pathInfo: PathMappingInfo,
  ): string | null {
    // For TypeScript path mappings, we need to construct the new mapped path
    if (pathInfo.alias.endsWith('*')) {
      // Handle wildcard patterns
      const _remainder = oldSpecifier.substring(pathInfo.aliasPattern.length);

      // Find the new relative path from the base to the new location
      const newRelativeFromBase = relative(pathInfo.basePath, newPath).replace(/\\/g, '/');

      // Check if the new path still fits within the same mapping pattern
      const expectedPattern = pathInfo.pathPattern;
      if (newRelativeFromBase.startsWith(expectedPattern)) {
        // Still fits the pattern, just update the remainder
        const newRemainder = newRelativeFromBase.substring(expectedPattern.length);
        return pathInfo.aliasPattern + newRemainder.replace(/\.(ts|tsx)$/, '');
      } else {
        // Check if we can find a different path mapping that matches the new location
        const newMappedPath = this.findMatchingPathMapping(newPath);
        if (newMappedPath) {
          return newMappedPath;
        }
      }
    } else {
      // Handle exact matches
      const _newRelativeFromBase = relative(pathInfo.basePath, newPath).replace(/\\/g, '/');

      // For exact matches, the alias should still work if the tsconfig is updated
      // But since we're not updating tsconfig, check if there's a wildcard pattern that matches
      const wildcardMapping = this.findMatchingPathMapping(newPath);
      if (wildcardMapping) {
        return wildcardMapping;
      }
    }

    // If it doesn't fit any pattern anymore, fall back to relative import
    return null;
  }

  private findMatchingPathMapping(newPath: string): string | null {
    // Try to find a path mapping that matches the new location
    for (const [_alias, pathInfos] of this.tsConfigPaths.entries()) {
      for (const pathInfo of pathInfos) {
        const newRelativeFromBase = relative(pathInfo.basePath, newPath).replace(/\\/g, '/');

        if (pathInfo.alias.endsWith('*')) {
          // Check if the new path fits this wildcard pattern
          if (newRelativeFromBase.startsWith(pathInfo.pathPattern)) {
            const remainder = newRelativeFromBase.substring(pathInfo.pathPattern.length);
            return pathInfo.aliasPattern + remainder.replace(/\.(ts|tsx)$/, '');
          }
        }
      }
    }
    return null;
  }
}
