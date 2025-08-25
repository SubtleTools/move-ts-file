---
editUrl: false
next: false
prev: false
title: "ImportAnalyzer"
---

Defined in: [import-analyzer.ts:12](https://github.com/SubtleTools/move-ts-file/blob/main/src/import-analyzer.ts#L12)

Analyzes TypeScript files to extract import and export statements

Uses the TypeScript compiler API to parse source files and extract all import
declarations and re-export statements. This information is used to track which
imports need to be updated when files are moved.

## Constructors

### Constructor

> **new ImportAnalyzer**(): `ImportAnalyzer`

#### Returns

`ImportAnalyzer`

## Methods

### analyzeFile()

> **analyzeFile**(`filePath`): `Promise`\<[`ImportReference`](/api/interfaces/importreference/)[]\>

Defined in: [import-analyzer.ts:74](https://github.com/SubtleTools/move-ts-file/blob/main/src/import-analyzer.ts#L74)

Analyzes a file and extracts its imports

Reads a TypeScript file from disk, parses it, and extracts all import
and export statements. This is a convenience method that combines file
reading with import extraction.

#### Parameters

##### filePath

`string`

Absolute path to the TypeScript file to analyze

#### Returns

`Promise`\<[`ImportReference`](/api/interfaces/importreference/)[]\>

Array of import references found in the file

#### Throws

Logs warnings for files that cannot be read or parsed

#### Example

```typescript
const analyzer = new ImportAnalyzer();
const imports = await analyzer.analyzeFile('/project/src/component.ts');
```

---

### createSourceFile()

> **createSourceFile**(`filePath`, `content`): `SourceFile`

Defined in: [import-analyzer.ts:102](https://github.com/SubtleTools/move-ts-file/blob/main/src/import-analyzer.ts#L102)

Creates a TypeScript source file from content

Creates a TypeScript AST source file object that can be used for analysis.
This is a utility method that wraps the TypeScript compiler API.

#### Parameters

##### filePath

`string`

Path to use for the source file (used for error reporting)

##### content

`string`

The TypeScript source code content

#### Returns

`SourceFile`

TypeScript source file object ready for AST analysis

#### Example

```typescript
const analyzer = new ImportAnalyzer();
const sourceFile = analyzer.createSourceFile(
  'test.ts',
  'import { x } from "./y";',
);
const imports = analyzer.extractImports(sourceFile);
```

---

### extractImports()

> **extractImports**(`sourceFile`): [`ImportReference`](/api/interfaces/importreference/)[]

Defined in: [import-analyzer.ts:31](https://github.com/SubtleTools/move-ts-file/blob/main/src/import-analyzer.ts#L31)

Extracts all import and export statements from a TypeScript source file

Uses the TypeScript compiler API to parse the AST and find all import declarations
and re-export statements with their positions in the source code. This includes
both regular imports (import { x } from './file') and re-exports (export { x } from './file').

#### Parameters

##### sourceFile

`SourceFile`

The TypeScript source file to analyze

#### Returns

[`ImportReference`](/api/interfaces/importreference/)[]

Array of import references with their specifiers and positions

#### Example

```typescript
const analyzer = new ImportAnalyzer();
const sourceFile = ts.createSourceFile(
  'test.ts',
  content,
  ts.ScriptTarget.Latest,
);
const imports = analyzer.extractImports(sourceFile);
// imports[0] might be { specifier: './utils', start: 15, end: 23, isExport: false }
```
