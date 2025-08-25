import { existsSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { PathResolver } from './path-resolver.js';
import type { ImportTypeInfo, PathMappingInfo } from './types.js';

/**
 * Resolves TypeScript config path mappings
 *
 * Handles imports that use TypeScript path mappings defined in tsconfig.json,
 * such as '@/components/*' mapping to './src/components/*'. Resolves these
 * mapped imports to actual file paths and calculates new mappings when files move.
 */
export class TsConfigPathResolver extends PathResolver {
  /**
   * Creates a new TsConfig path resolver
   *
   * @param tsConfigPaths - Map of path mappings loaded from tsconfig.json files
   */
  constructor(private tsConfigPaths: Map<string, PathMappingInfo[]>) {
    super();
  }

  /**
   * Resolves a TypeScript path mapping import to an absolute file path
   *
   * @param specifier - The import specifier (e.g., '@/components/Button')
   * @param _fromFile - Absolute path of the file containing the import (unused)
   * @returns Absolute path of the resolved file, or null if not a tsconfig path
   */
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

  /**
   * Calculates the new TypeScript path mapping import when a file is moved
   *
   * @param oldSpecifier - The original import specifier
   * @param _fromFile - Absolute path of the file containing the import (unused)
   * @param newPath - The new absolute path of the moved file
   * @returns New path mapping specifier, or null if path doesn't fit any mapping
   */
  calculateNewImportPath(
    oldSpecifier: string,
    _fromFile: string,
    newPath: string,
  ): string | null {
    const pathInfo = this.findMatchingPathInfo(oldSpecifier);
    if (!pathInfo) return null;

    return this.calculateTsConfigImportPath(oldSpecifier, newPath, pathInfo);
  }

  /**
   * Determines if an import uses TypeScript path mappings
   *
   * @param specifier - The import specifier to analyze
   * @param _fromFile - Absolute path of the file containing the import (unused)
   * @returns Import type information if it's a tsconfig path, or null otherwise
   */
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

  /**
   * Checks if a specifier matches a TypeScript path mapping alias
   *
   * @param specifier - The import specifier to check
   * @param pathInfo - The path mapping information to match against
   * @returns True if the specifier matches the alias pattern
   */
  private matchesAlias(specifier: string, pathInfo: PathMappingInfo): boolean {
    if (pathInfo.alias.endsWith('*')) {
      return specifier.startsWith(pathInfo.aliasPattern);
    } else {
      return specifier === pathInfo.aliasPattern;
    }
  }

  /**
   * Resolves a TypeScript path mapping to an absolute file path
   *
   * @param specifier - The import specifier to resolve
   * @param pathInfo - The matching path mapping information
   * @returns Absolute path to the resolved file, or null if not found
   */
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

  /**
   * Finds the path mapping information that matches a specifier
   *
   * @param specifier - The import specifier to find a match for
   * @returns Matching path mapping info, or null if no match found
   */
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

  /**
   * Calculates the new TypeScript import path for a moved file
   *
   * @param oldSpecifier - The original import specifier
   * @param newPath - The new absolute path of the moved file
   * @param pathInfo - The path mapping information for the old specifier
   * @returns New import path, or null if the file no longer fits the mapping
   */
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

  /**
   * Finds a path mapping that matches a file's new location
   *
   * @param newPath - The new absolute path of the moved file
   * @returns New import path using a matching path mapping, or null if none found
   */
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
