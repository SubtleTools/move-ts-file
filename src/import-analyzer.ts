import { readFile } from 'node:fs/promises';
import * as ts from 'typescript';
import type { ImportReference } from './types.js';

/**
 * Analyzes TypeScript files to extract import and export statements
 */
export class ImportAnalyzer {
  /**
   * Extracts all import and export statements from a TypeScript source file.
   *
   * Uses the TypeScript compiler API to parse the AST and find all import declarations
   * and re-export statements with their positions in the source code.
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
   */
  createSourceFile(filePath: string, content: string): ts.SourceFile {
    return ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
  }
}
