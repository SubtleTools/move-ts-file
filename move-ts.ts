#!/usr/bin/env node
import { glob } from 'glob'
import { existsSync, renameSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, extname, isAbsolute, join, relative, resolve } from 'node:path'
import * as ts from 'typescript'

/**
 * Represents a reference to an import or export statement in a TypeScript file.
 * Used to track import locations for updating when files are moved.
 */
interface ImportReference {
  /** The import specifier string (e.g., './file', '@/components/Button') */
  specifier: string
  /** Start position of the import specifier in the source file */
  start: number
  /** End position of the import specifier in the source file */
  end: number
  /** Whether this is an export re-export statement */
  isExport: boolean
  /** New file path after moving (used during update calculation) */
  newPath?: string
}

/**
 * Represents a file that needs import updates after a TypeScript file is moved.
 * Contains the file content and all import references that need updating.
 */
interface FileUpdate {
  /** Absolute path to the file that needs updating */
  filePath: string
  /** Current content of the file */
  content: string
  /** List of import references in this file that need updating */
  references: ImportReference[]
}

/**
 * Information about a TypeScript path mapping configuration from tsconfig.json.
 * Used to resolve imports that use tsconfig path mappings like '@/components/*'.
 */
interface PathMappingInfo {
  /** The original alias pattern from tsconfig.json (e.g., '@/components/*') */
  alias: string
  /** The alias pattern without wildcards (e.g., '@/components/') */
  aliasPattern: string
  /** The path pattern it maps to (e.g., './src/components/') */
  pathPattern: string
  /** Absolute base path for resolving relative paths */
  basePath: string
}

/**
 * Information about Node.js package imports (subpath imports) from package.json.
 * Used to resolve imports that start with '#' like '#internal/utils'.
 */
interface PackageImportsInfo {
  /** Map of import patterns to their resolved paths */
  imports: Map<string, string | string[]>
  /** Root directory containing the package.json with imports */
  packageRoot: string
}

/**
 * A powerful TypeScript file mover that intelligently handles import path updates.
 *
 * This class provides functionality to move TypeScript files while automatically
 * finding and updating all import statements that reference the moved file throughout
 * the entire project. It supports multiple import resolution strategies including:
 *
 * - Relative imports (e.g., './file', '../utils/helper')
 * - TypeScript path mappings from tsconfig.json (e.g., '@/components/Button')
 * - Node.js package imports/subpath imports (e.g., '#internal/utils')
 * - Complex monorepo structures with multiple tsconfig files
 *
 * The tool preserves the original import style when possible and falls back to
 * relative imports when the original pattern can no longer be maintained.
 *
 * @example
 * ```typescript
 * const mover = new TypeScriptFileMover('/path/to/project');
 * await mover.init();
 * await mover.moveFile('src/old-location.ts', 'src/new-location.ts');
 * ```
 */
export class TypeScriptFileMover {
  /** Root directory of the TypeScript project */
  private projectRoot: string
  /** Map of TypeScript path mappings from all tsconfig files in the project */
  private tsConfigPaths: Map<string, PathMappingInfo[]> = new Map()
  /** List of package import configurations from package.json files */
  private packageImports: PackageImportsInfo[] = []

  /**
   * Creates a new TypeScript file mover instance.
   *
   * @param projectRoot - Root directory of the TypeScript project. Defaults to current working directory.
   */
  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot
  }

  /**
   * Initializes the TypeScript file mover by loading configuration from tsconfig.json
   * and package.json files throughout the project.
   *
   * This method must be called before using moveFile(). It scans for all tsconfig.json
   * and package.json files in the project to understand path mappings and import configurations.
   *
   * @throws {Error} If configuration files cannot be parsed
   */
  async init(): Promise<void> {
    await this.loadTsConfigPaths()
    await this.loadPackageImports()
  }

  /**
   * Loads TypeScript path mappings from all tsconfig.json files in the project.
   *
   * Scans for tsconfig*.json files and extracts compilerOptions.paths to understand
   * how imports like '@/components/Button' should be resolved.
   *
   * @private
   */
  private async loadTsConfigPaths(): Promise<void> {
    const tsConfigFiles = await glob('**/tsconfig*.json', {
      cwd: this.projectRoot,
      ignore: '**/node_modules/**',
    })

    for (const configFile of tsConfigFiles) {
      try {
        const configPath = resolve(this.projectRoot, configFile)
        const configContent = await readFile(configPath, 'utf-8')
        const config = ts.parseConfigFileTextToJson(configPath, configContent)

        if (config.config?.compilerOptions?.paths) {
          const baseUrl = config.config.compilerOptions.baseUrl || '.'
          const basePath = resolve(dirname(configPath), baseUrl)

          for (const [alias, paths] of Object.entries(config.config.compilerOptions.paths)) {
            const pathInfos: PathMappingInfo[] = (paths as string[]).map(pathPattern => {
              const aliasPattern = alias.replace(/\*$/, '')
              const normalizedPathPattern = pathPattern.replace(/\*$/, '')

              return {
                alias,
                aliasPattern,
                pathPattern: normalizedPathPattern,
                basePath,
              }
            })

            this.tsConfigPaths.set(alias, pathInfos)
          }
        }
      } catch (error) {
        console.warn(`Failed to parse ${configFile}:`, error)
      }
    }
  }

  /**
   * Loads Node.js package imports from all package.json files in the project.
   *
   * Scans for package.json files with 'imports' field and extracts subpath import
   * configurations to understand how imports like '#internal/utils' should be resolved.
   *
   * @private
   */
  private async loadPackageImports(): Promise<void> {
    const packageJsonFiles = await glob('**/package.json', {
      cwd: this.projectRoot,
      ignore: '**/node_modules/**',
    })

    for (const packageFile of packageJsonFiles) {
      try {
        const packagePath = resolve(this.projectRoot, packageFile)
        const packageContent = await readFile(packagePath, 'utf-8')
        const packageJson = JSON.parse(packageContent)

        if (packageJson.imports) {
          const imports = new Map<string, string | string[]>()
          for (const [key, value] of Object.entries(packageJson.imports)) {
            imports.set(key, value as string | string[])
          }

          this.packageImports.push({
            imports,
            packageRoot: dirname(packagePath),
          })
        }
      } catch (error) {
        console.warn(`Failed to parse ${packageFile}:`, error)
      }
    }
  }

  /**
   * Moves a TypeScript file and automatically updates all import paths throughout the project.
   *
   * This is the main method that orchestrates the entire file moving process:
   * 1. Validates the source file exists and is a TypeScript file
   * 2. Finds all files in the project that import the source file
   * 3. Moves the source file to the destination
   * 4. Updates all import statements to point to the new location
   * 5. Reports which files were updated
   *
   * @param sourcePath - Path to the source TypeScript file to move (relative to project root)
   * @param destPath - Path to the destination location (relative to project root)
   *
   * @throws {Error} If source file doesn't exist, isn't a TypeScript file, or destination already exists
   *
   * @example
   * ```typescript
   * await mover.moveFile('src/utils/helper.ts', 'src/lib/helper.ts');
   * ```
   */
  async moveFile(sourcePath: string, destPath: string): Promise<void> {
    const resolvedSource = resolve(this.projectRoot, sourcePath)
    const resolvedDest = this.resolveDestination(destPath)

    // Validate source file exists
    if (!existsSync(resolvedSource)) {
      throw new Error(`Source file does not exist: ${sourcePath}`)
    }

    // Validate it's a TypeScript file
    if (!['.ts', '.tsx'].includes(extname(resolvedSource))) {
      throw new Error(`Source must be a TypeScript file (.ts or .tsx): ${sourcePath}`)
    }

    // Check if destination already exists
    if (existsSync(resolvedDest)) {
      throw new Error(`Destination already exists: ${resolvedDest}`)
    }

    // Create destination directory if needed
    await mkdir(dirname(resolvedDest), { recursive: true })

    console.log(`Moving ${sourcePath} to ${resolvedDest}`)

    // Find all files that might import this file
    const affectedFiles = await this.findAffectedFiles(resolvedSource)

    // Calculate the old and new import paths
    const updates = await this.calculateImportUpdates(resolvedSource, resolvedDest, affectedFiles)

    // Move the file
    renameSync(resolvedSource, resolvedDest)

    // Update all import statements
    await this.updateImportStatements(updates)

    console.log(`Successfully moved file and updated ${updates.length} files with import changes`)
  }

  private resolveDestination(destPath: string): string {
    if (isAbsolute(destPath)) {
      return destPath
    }

    const resolvedDest = resolve(this.projectRoot, destPath)

    // If destPath is a directory, keep the original filename
    if (destPath.endsWith('/') || (!extname(destPath) && !destPath.includes('.'))) {
      // It's a directory - we need the source filename
      throw new Error(
        'Destination directory specified, but source filename is needed. Use: move-ts.ts <source> <dest-dir/filename.ts>',
      )
    }

    return resolvedDest
  }

  /**
   * Finds all TypeScript files in the project that import the specified source file.
   *
   * Uses TypeScript AST parsing to analyze import statements in all .ts and .tsx files,
   * resolving each import to determine if it references the source file.
   *
   * @param sourcePath - Absolute path to the source file to find references for
   * @returns Array of absolute file paths that import the source file
   *
   * @private
   */
  private async findAffectedFiles(sourcePath: string): Promise<string[]> {
    const files = await glob('**/*.{ts,tsx}', {
      cwd: this.projectRoot,
      ignore: '**/node_modules/**',
      absolute: true,
    })

    const affectedFiles: string[] = []
    const sourcePathForMatching = this.normalizePathForMatching(sourcePath)

    for (const file of files) {
      if (file === sourcePath) continue

      try {
        const content = await readFile(file, 'utf-8')
        const sourceFile = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true)
        const imports = this.extractImports(sourceFile)

        for (const imp of imports) {
          const resolvedImport = this.resolveImportPath(imp.specifier, file)
          if (resolvedImport && this.normalizePathForMatching(resolvedImport) === sourcePathForMatching) {
            affectedFiles.push(file)
            break
          }
        }
      } catch (error) {
        console.warn(`Failed to analyze file ${file}:`, error)
      }
    }

    return affectedFiles
  }

  private normalizePathForMatching(filePath: string): string {
    return filePath.replace(/\\/g, '/').toLowerCase()
  }

  /**
   * Extracts all import and export statements from a TypeScript source file.
   *
   * Uses the TypeScript compiler API to parse the AST and find all import declarations
   * and re-export statements with their positions in the source code.
   *
   * @param sourceFile - TypeScript AST source file to analyze
   * @returns Array of import references found in the file
   *
   * @private
   */
  private extractImports(sourceFile: ts.SourceFile): ImportReference[] {
    const imports: ImportReference[] = []

    function visit(node: ts.Node) {
      if (ts.isImportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        imports.push({
          specifier: node.moduleSpecifier.text,
          start: node.moduleSpecifier.getStart(),
          end: node.moduleSpecifier.getEnd(),
          isExport: false,
        })
      } else if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        imports.push({
          specifier: node.moduleSpecifier.text,
          start: node.moduleSpecifier.getStart(),
          end: node.moduleSpecifier.getEnd(),
          isExport: true,
        })
      }
      ts.forEachChild(node, visit)
    }

    visit(sourceFile)
    return imports
  }

  /**
   * Resolves an import specifier to its absolute file path using multiple strategies.
   *
   * Tries resolution in order of priority:
   * 1. TypeScript path mappings from tsconfig.json
   * 2. Node.js package imports from package.json
   * 3. Relative path resolution
   *
   * @param specifier - The import specifier string (e.g., './file', '@/components/Button')
   * @param fromFile - Absolute path of the file containing the import
   * @returns Absolute path to the imported file, or null if not resolvable
   *
   * @private
   */
  private resolveImportPath(specifier: string, fromFile: string): string | null {
    // Try different resolution strategies in order

    // 1. Try TypeScript path mapping
    const tsPathResolved = this.resolveTsConfigPath(specifier, fromFile)
    if (tsPathResolved) return tsPathResolved

    // 2. Try package.json imports
    const packageImportResolved = this.resolvePackageImport(specifier, fromFile)
    if (packageImportResolved) return packageImportResolved

    // 3. Try relative imports
    const relativeResolved = this.resolveRelativePath(specifier, fromFile)
    if (relativeResolved) return relativeResolved

    return null
  }

  private resolveTsConfigPath(specifier: string, _fromFile: string): string | null {
    for (const [_alias, pathInfos] of this.tsConfigPaths.entries()) {
      for (const pathInfo of pathInfos) {
        if (this.matchesAlias(specifier, pathInfo)) {
          const resolvedPath = this.resolveTsPath(specifier, pathInfo)
          if (resolvedPath && existsSync(resolvedPath)) {
            return resolvedPath
          }
        }
      }
    }
    return null
  }

  private matchesAlias(specifier: string, pathInfo: PathMappingInfo): boolean {
    if (pathInfo.alias.endsWith('*')) {
      return specifier.startsWith(pathInfo.aliasPattern)
    } else {
      return specifier === pathInfo.aliasPattern
    }
  }

  private resolveTsPath(specifier: string, pathInfo: PathMappingInfo): string | null {
    let resolvedPath: string

    if (pathInfo.alias.endsWith('*')) {
      // Handle wildcard patterns
      const remainder = specifier.substring(pathInfo.aliasPattern.length)
      resolvedPath = resolve(pathInfo.basePath, pathInfo.pathPattern + remainder)
    } else {
      // Exact match
      resolvedPath = resolve(pathInfo.basePath, pathInfo.pathPattern)
    }

    // Try with different extensions
    const extensions = ['.ts', '.tsx', '.js', '.jsx']

    // Try exact path first
    if (existsSync(resolvedPath)) {
      return resolvedPath
    }

    // Try with extensions
    for (const ext of extensions) {
      const pathWithExt = resolvedPath + ext
      if (existsSync(pathWithExt)) {
        return pathWithExt
      }
    }

    // Try index files
    for (const ext of extensions) {
      const indexPath = join(resolvedPath, `index${ext}`)
      if (existsSync(indexPath)) {
        return indexPath
      }
    }

    return null
  }

  private resolvePackageImport(specifier: string, fromFile: string): string | null {
    if (!specifier.startsWith('#')) {
      return null
    }

    // Find the appropriate package.json context
    const packageInfo = this.findPackageImportContext(fromFile)
    if (!packageInfo) return null

    for (const [importKey, importValue] of packageInfo.imports.entries()) {
      if (this.matchesPackageImport(specifier, importKey)) {
        const resolvedPath = this.resolvePackageImportPath(specifier, importKey, importValue, packageInfo.packageRoot)
        if (resolvedPath && existsSync(resolvedPath)) {
          return resolvedPath
        }
      }
    }

    return null
  }

  private findPackageImportContext(fromFile: string): PackageImportsInfo | null {
    // Find the closest package.json that contains the fromFile
    for (const packageInfo of this.packageImports) {
      if (fromFile.startsWith(packageInfo.packageRoot)) {
        return packageInfo
      }
    }
    return null
  }

  private matchesPackageImport(specifier: string, importKey: string): boolean {
    if (importKey.endsWith('*')) {
      const pattern = importKey.slice(0, -1)
      return specifier.startsWith(pattern)
    } else {
      return specifier === importKey
    }
  }

  private resolvePackageImportPath(
    specifier: string,
    importKey: string,
    importValue: string | string[],
    packageRoot: string,
  ): string | null {
    const values = Array.isArray(importValue) ? importValue : [importValue]

    for (const value of values) {
      let resolvedPath: string

      if (importKey.endsWith('*') && value.includes('*')) {
        // Handle wildcard patterns
        const pattern = importKey.slice(0, -1)
        const remainder = specifier.substring(pattern.length)
        resolvedPath = resolve(packageRoot, value.replace('*', remainder))
      } else {
        // Exact match
        resolvedPath = resolve(packageRoot, value)
      }

      // Try with different extensions
      const extensions = ['.ts', '.tsx', '.js', '.jsx']

      if (existsSync(resolvedPath)) {
        return resolvedPath
      }

      for (const ext of extensions) {
        const pathWithExt = resolvedPath + ext
        if (existsSync(pathWithExt)) {
          return pathWithExt
        }
      }
    }

    return null
  }

  private resolveRelativePath(specifier: string, fromFile: string): string | null {
    // Skip non-relative imports
    if (!specifier.startsWith('.') && !specifier.startsWith('/')) {
      return null
    }

    try {
      const fromDir = dirname(fromFile)
      const resolved = resolve(fromDir, specifier)

      // Try different extensions
      const extensions = ['.ts', '.tsx', '.js', '.jsx']
      for (const ext of extensions) {
        if (existsSync(resolved + ext)) {
          return resolved + ext
        }
      }

      // Try index files
      for (const ext of extensions) {
        const indexPath = join(resolved, `index${ext}`)
        if (existsSync(indexPath)) {
          return indexPath
        }
      }

      if (existsSync(resolved)) {
        return resolved
      }
    } catch (_error) {
      // Failed to resolve
    }

    return null
  }

  /**
   * Calculates what import updates are needed for each affected file after moving a source file.
   *
   * Analyzes each affected file to determine which imports reference the moved file
   * and prepares the data needed to update those imports to point to the new location.
   *
   * @param oldPath - Original absolute path of the moved file
   * @param newPath - New absolute path of the moved file
   * @param affectedFiles - List of files that import the moved file
   * @returns Array of file updates with import changes needed
   *
   * @private
   */
  private async calculateImportUpdates(
    oldPath: string,
    newPath: string,
    affectedFiles: string[],
  ): Promise<FileUpdate[]> {
    const updates: FileUpdate[] = []

    for (const file of affectedFiles) {
      try {
        const content = await readFile(file, 'utf-8')
        const sourceFile = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true)
        const imports = this.extractImports(sourceFile)

        const relevantImports = imports.filter(imp => {
          const resolvedImport = this.resolveImportPath(imp.specifier, file)
          return (
            resolvedImport && this.normalizePathForMatching(resolvedImport) === this.normalizePathForMatching(oldPath)
          )
        })

        if (relevantImports.length > 0) {
          // Store both old and new path for correct calculation
          updates.push({
            filePath: file,
            content,
            references: relevantImports.map(ref => ({
              ...ref,
              newPath: newPath, // Add the new path to the reference
            })),
          })
        }
      } catch (error) {
        console.warn(`Failed to analyze ${file}:`, error)
      }
    }

    return updates
  }

  /**
   * Updates import statements in all affected files by replacing old import paths with new ones.
   *
   * Processes each file update by replacing import specifiers in-place and writing
   * the updated content back to disk. Updates are applied in reverse order by position
   * to maintain correct string indices.
   *
   * @param updates - Array of file updates to apply
   *
   * @private
   */
  private async updateImportStatements(updates: FileUpdate[]): Promise<void> {
    for (const update of updates) {
      try {
        let content = update.content
        const sortedReferences = [...update.references].sort((a, b) => b.start - a.start)

        for (const ref of sortedReferences) {
          const newImportPath = this.calculateNewImportPath(ref.specifier, update.filePath, ref)
          content = content.substring(0, ref.start + 1) + newImportPath + content.substring(ref.end - 1)
        }

        await writeFile(update.filePath, content, 'utf-8')
        console.log(`Updated imports in: ${relative(this.projectRoot, update.filePath)}`)
      } catch (error) {
        console.error(`Failed to update ${update.filePath}:`, error)
      }
    }
  }

  private calculateNewImportPath(oldSpecifier: string, fromFile: string, reference: ImportReference): string {
    if (!reference.newPath) {
      return oldSpecifier
    }

    // Determine the type of the original import
    const importType = this.getImportType(oldSpecifier, fromFile)

    switch (importType.type) {
      case 'tsconfig': {
        if (importType.pathInfo) {
          const tsConfigPath = this.calculateTsConfigImportPath(oldSpecifier, reference.newPath, importType.pathInfo)
          if (tsConfigPath) return tsConfigPath
        }
        return this.calculateRelativeImportPath(oldSpecifier, fromFile, reference.newPath)
      }
      case 'package': {
        if (importType.packageInfo) {
          const packagePath = this.calculatePackageImportPath(oldSpecifier, reference.newPath, importType.packageInfo)
          if (packagePath) return packagePath
        }
        return this.calculateRelativeImportPath(oldSpecifier, fromFile, reference.newPath)
      }
      default:
        return this.calculateRelativeImportPath(oldSpecifier, fromFile, reference.newPath)
    }
  }

  private getImportType(
    specifier: string,
    fromFile: string,
  ): {
    type: 'tsconfig' | 'package' | 'relative'
    pathInfo?: PathMappingInfo
    packageInfo?: PackageImportsInfo
  } {
    // Check if it's a TypeScript path mapping
    for (const [_alias, pathInfos] of this.tsConfigPaths.entries()) {
      for (const pathInfo of pathInfos) {
        if (this.matchesAlias(specifier, pathInfo)) {
          return { type: 'tsconfig', pathInfo }
        }
      }
    }

    // Check if it's a package import
    if (specifier.startsWith('#')) {
      const packageInfo = this.findPackageImportContext(fromFile)
      if (packageInfo) {
        return { type: 'package', packageInfo }
      }
    }

    // Default to relative
    return { type: 'relative' }
  }

  private calculateTsConfigImportPath(oldSpecifier: string, newPath: string, pathInfo: PathMappingInfo): string | null {
    // For TypeScript path mappings, we need to construct the new mapped path
    if (pathInfo.alias.endsWith('*')) {
      // Handle wildcard patterns
      const _remainder = oldSpecifier.substring(pathInfo.aliasPattern.length)

      // Find the new relative path from the base to the new location
      const newRelativeFromBase = relative(pathInfo.basePath, newPath).replace(/\\/g, '/')

      // Check if the new path still fits within the same mapping pattern
      const expectedPattern = pathInfo.pathPattern
      if (newRelativeFromBase.startsWith(expectedPattern)) {
        // Still fits the pattern, just update the remainder
        const newRemainder = newRelativeFromBase.substring(expectedPattern.length)
        return pathInfo.aliasPattern + newRemainder.replace(/\.(ts|tsx)$/, '')
      } else {
        // Check if we can find a different path mapping that matches the new location
        const newMappedPath = this.findMatchingPathMapping(newPath)
        if (newMappedPath) {
          return newMappedPath
        }
      }
    } else {
      // Handle exact matches
      const _newRelativeFromBase = relative(pathInfo.basePath, newPath).replace(/\\/g, '/')

      // For exact matches, the alias should still work if the tsconfig is updated
      // But since we're not updating tsconfig, check if there's a wildcard pattern that matches
      const wildcardMapping = this.findMatchingPathMapping(newPath)
      if (wildcardMapping) {
        return wildcardMapping
      }
    }

    // If it doesn't fit any pattern anymore, fall back to relative import
    // This happens when files are moved across different path mapping boundaries
    return null // Signal that we should fall back to relative
  }

  private calculatePackageImportPath(
    oldSpecifier: string,
    newPath: string,
    packageInfo: PackageImportsInfo,
  ): string | null {
    // For package imports, try to maintain the same import pattern if possible
    for (const [importKey, importValue] of packageInfo.imports.entries()) {
      if (this.matchesPackageImport(oldSpecifier, importKey)) {
        const values = Array.isArray(importValue) ? importValue : [importValue]

        for (const value of values) {
          if (importKey.endsWith('*') && value.includes('*')) {
            // Handle wildcard patterns
            const pattern = importKey.slice(0, -1)

            // Check if the new path still fits within this package import pattern
            const newRelativeFromPackage = relative(packageInfo.packageRoot, newPath).replace(/\\/g, '/')
            const expectedValuePattern = value.replace('*', '').replace(/\.(js|jsx)$/, '')

            if (newRelativeFromPackage.startsWith(expectedValuePattern)) {
              const newRemainder = newRelativeFromPackage.substring(expectedValuePattern.length)
              return pattern + newRemainder.replace(/\.(ts|tsx)$/, '')
            }
          }
        }
      }
    }

    // If it doesn't fit the package import pattern anymore, return null to fall back
    return null
  }

  private findMatchingPathMapping(newPath: string): string | null {
    // Try to find a path mapping that matches the new location
    for (const [_alias, pathInfos] of this.tsConfigPaths.entries()) {
      for (const pathInfo of pathInfos) {
        const newRelativeFromBase = relative(pathInfo.basePath, newPath).replace(/\\/g, '/')

        if (pathInfo.alias.endsWith('*')) {
          // Check if the new path fits this wildcard pattern
          if (newRelativeFromBase.startsWith(pathInfo.pathPattern)) {
            const remainder = newRelativeFromBase.substring(pathInfo.pathPattern.length)
            return pathInfo.aliasPattern + remainder.replace(/\.(ts|tsx)$/, '')
          }
        }
      }
    }
    return null
  }

  private calculateRelativeImportPath(_oldSpecifier: string, fromFile: string, newPath: string): string {
    const fromDir = dirname(fromFile)

    // Calculate new relative path from the importing file to the new location
    let newRelativePath = relative(fromDir, newPath)

    // Remove the .ts/.tsx extension from the import path (TypeScript convention)
    newRelativePath = newRelativePath.replace(/\.(ts|tsx)$/, '')

    // Ensure it starts with ./ or ../
    if (!newRelativePath.startsWith('.')) {
      newRelativePath = `./${newRelativePath}`
    }

    return newRelativePath
  }
}

/**
 * Main CLI entry point that processes command line arguments and executes the file move operation.
 *
 * Validates command line arguments, creates a TypeScriptFileMover instance, and performs
 * the file move operation with proper error handling and user feedback.
 *
 * @example
 * ```bash
 * move-ts-file src/old-file.ts src/new-location/
 * move-ts-file components/Button.tsx shared/ui/Button.tsx
 * ```
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2)

  if (args.length !== 2) {
    console.error('Usage: move-ts <source-file> <destination>')
    console.error('')
    console.error('Examples:')
    console.error('  move-ts src/old-file.ts src/new-location/')
    console.error('  move-ts src/old-file.ts src/new-location/new-name.ts')
    console.error('  move-ts components/Button.tsx shared/ui/Button.tsx')
    process.exit(1)
  }

  const [sourcePath, destPath] = args

  try {
    const mover = new TypeScriptFileMover()
    await mover.init()
    await mover.moveFile(sourcePath, destPath)
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

// Export the class for programmatic usage (already handled by export above)

// Check if this file is being run directly (using import.meta for ES modules)
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
