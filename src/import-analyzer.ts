import { readFile } from 'node:fs/promises';
import * as ts from 'typescript';
import type { ImportReference } from './types.js';

/**
 * Analyzes TypeScript files to extract import and export statements
 *
 * Uses the TypeScript compiler API to parse source files and extract all import
 * declarations and re-export statements. This information is used to track which
 * imports need to be updated when files are moved.
 */
export class ImportAnalyzer {
  /**
   * Extracts all import and export statements from a TypeScript source file
   *
   * Uses the TypeScript compiler API to parse the AST and find all import declarations
   * and re-export statements with their positions in the source code. This includes
   * both regular imports (import { x } from './file') and re-exports (export { x } from './file').
   *
   * @param sourceFile - The TypeScript source file to analyze
   * @returns Array of import references with their specifiers and positions
   *
   * @example
   * ```typescript
   * const analyzer = new ImportAnalyzer();
   * const sourceFile = ts.createSourceFile('test.ts', content, ts.ScriptTarget.Latest);
   * const imports = analyzer.extractImports(sourceFile);
   * // imports[0] might be { specifier: './utils', start: 15, end: 23, isExport: false }
   * ```
   */
  extractImports(sourceFile: ts.SourceFile): ImportReference[] {
    const imports: ImportReference[] = [];

    function visit(node: ts.Node) {
      if (ts.isImportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        imports.push({
          specifier: node.moduleSpecifier.text,
          start: node.moduleSpecifier.getStart(),
          end: node.moduleSpecifier.getEnd(),
          isExport: false,
        });
      } else if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        imports.push({
          specifier: node.moduleSpecifier.text,
          start: node.moduleSpecifier.getStart(),
          end: node.moduleSpecifier.getEnd(),
          isExport: true,
        });
      }
      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return imports;
  }

  /**
   * Analyzes a file and extracts its imports
   *
   * Reads a TypeScript file from disk, parses it, and extracts all import
   * and export statements. This is a convenience method that combines file
   * reading with import extraction.
   *
   * @param filePath - Absolute path to the TypeScript file to analyze
   * @returns Array of import references found in the file
   * @throws Logs warnings for files that cannot be read or parsed
   *
   * @example
   * ```typescript
   * const analyzer = new ImportAnalyzer();
   * const imports = await analyzer.analyzeFile('/project/src/component.ts');
   * ```
   */
  async analyzeFile(filePath: string): Promise<ImportReference[]> {
    try {
      const content = await readFile(filePath, 'utf-8');
      const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
      return this.extractImports(sourceFile);
    } catch (error) {
      console.warn(`Failed to analyze file ${filePath}:`, error);
      return [];
    }
  }

  /**
   * Creates a TypeScript source file from content
   *
   * Creates a TypeScript AST source file object that can be used for analysis.
   * This is a utility method that wraps the TypeScript compiler API.
   *
   * @param filePath - Path to use for the source file (used for error reporting)
   * @param content - The TypeScript source code content
   * @returns TypeScript source file object ready for AST analysis
   *
   * @example
   * ```typescript
   * const analyzer = new ImportAnalyzer();
   * const sourceFile = analyzer.createSourceFile('test.ts', 'import { x } from "./y";');
   * const imports = analyzer.extractImports(sourceFile);
   * ```
   */
  createSourceFile(filePath: string, content: string): ts.SourceFile {
    return ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
  }
}
