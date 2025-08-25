import { glob } from 'glob';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import * as ts from 'typescript';
import type { PackageImportsInfo, PathMappingInfo } from './types.js';

/**
 * Loads configuration from tsconfig.json and package.json files
 */
export class ConfigLoader {
  constructor(private projectRoot: string) {}

  /**
   * Loads TypeScript path mappings from all tsconfig.json files in the project.
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
   * Loads Node.js package imports from all package.json files in the project.
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
