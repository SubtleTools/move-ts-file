import { glob } from 'glob';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import * as ts from 'typescript';
import type { PackageImportsInfo, PathMappingInfo } from './types.js';

/**
 * Loads configuration from tsconfig.json and package.json files
 *
 * This class scans the project directory for configuration files and extracts
 * TypeScript path mappings and Node.js package imports that are used for
 * resolving import statements.
 */
export class ConfigLoader {
  /**
   * Creates a new ConfigLoader instance
   *
   * @param projectRoot - Absolute path to the project root directory
   */
  constructor(private projectRoot: string) {}

  /**
   * Loads TypeScript path mappings from all tsconfig.json files in the project
   *
   * Scans for all tsconfig*.json files and extracts the 'paths' configuration
   * from the compilerOptions. These path mappings are used to resolve imports
   * like '@/components/*' to actual file paths.
   *
   * @returns Map where keys are alias patterns and values are arrays of path mapping info
   * @throws Logs warnings for invalid tsconfig.json files but continues processing
   *
   * @example
   * ```typescript
   * const loader = new ConfigLoader('/project');
   * const paths = await loader.loadTsConfigPaths();
   * // paths.get('@/*') might return [{ alias: '@/*', pathPattern: './src/', ... }]
   * ```
   */
  async loadTsConfigPaths(): Promise<Map<string, PathMappingInfo[]>> {
    const tsConfigPaths = new Map<string, PathMappingInfo[]>();

    const tsConfigFiles = await glob('**/tsconfig*.json', {
      cwd: this.projectRoot,
      ignore: '**/node_modules/**',
    });

    for (const configFile of tsConfigFiles) {
      try {
        const configPath = resolve(this.projectRoot, configFile);
        const configContent = await readFile(configPath, 'utf-8');
        const config = ts.parseConfigFileTextToJson(configPath, configContent);

        if (config.config?.compilerOptions?.paths) {
          const baseUrl = config.config.compilerOptions.baseUrl || '.';
          const basePath = resolve(dirname(configPath), baseUrl);

          for (const [alias, paths] of Object.entries(config.config.compilerOptions.paths)) {
            const pathInfos: PathMappingInfo[] = (paths as string[]).map(pathPattern => {
              const aliasPattern = alias.replace(/\*$/, '');
              const normalizedPathPattern = pathPattern.replace(/\*$/, '');

              return {
                alias,
                aliasPattern,
                pathPattern: normalizedPathPattern,
                basePath,
              };
            });

            tsConfigPaths.set(alias, pathInfos);
          }
        }
      } catch (error) {
        console.warn(`Failed to parse ${configFile}:`, error);
      }
    }

    return tsConfigPaths;
  }

  /**
   * Loads Node.js package imports from all package.json files in the project
   *
   * Scans for all package.json files and extracts the 'imports' field which defines
   * Node.js subpath imports (imports that start with '#'). These are used to resolve
   * imports like '#internal/utils' to actual file paths.
   *
   * @returns Array of package imports information from all package.json files
   * @throws Logs warnings for invalid package.json files but continues processing
   *
   * @example
   * ```typescript
   * const loader = new ConfigLoader('/project');
   * const imports = await loader.loadPackageImports();
   * // imports[0].imports.get('#internal/*') might return './src/internal/*'
   * ```
   */
  async loadPackageImports(): Promise<PackageImportsInfo[]> {
    const packageImports: PackageImportsInfo[] = [];

    const packageJsonFiles = await glob('**/package.json', {
      cwd: this.projectRoot,
      ignore: '**/node_modules/**',
    });

    for (const packageFile of packageJsonFiles) {
      try {
        const packagePath = resolve(this.projectRoot, packageFile);
        const packageContent = await readFile(packagePath, 'utf-8');
        const packageJson = JSON.parse(packageContent);

        if (packageJson.imports) {
          const imports = new Map<string, string | string[]>();
          for (const [key, value] of Object.entries(packageJson.imports)) {
            imports.set(key, value as string | string[]);
          }

          packageImports.push({
            imports,
            packageRoot: dirname(packagePath),
          });
        }
      } catch (error) {
        console.warn(`Failed to parse ${packageFile}:`, error);
      }
    }

    return packageImports;
  }
}
