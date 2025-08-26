---
editUrl: false
next: false
prev: false
title: "BarrelAnalyzer"
---

Defined in: [barrel-analyzer.ts:20](https://github.com/SubtleTools/move-ts-file/blob/main/src/barrel-analyzer.ts#L20)

Analyzes barrel exports (re-exports) in TypeScript files and tracks dependencies.

A barrel file is typically an index.ts that re-exports from other modules:
```typescript
export { Button } from './components/Button.ts';
export * from './utils/helper.ts';
export { default as Logger } from './services/logger.ts';
```

This analyzer helps detect when moving a file breaks barrel exports and
finds all imports that transitively depend on those broken exports.

## Constructors

### Constructor

> **new BarrelAnalyzer**(`projectRoot`): `BarrelAnalyzer`

Defined in: [barrel-analyzer.ts:29](https://github.com/SubtleTools/move-ts-file/blob/main/src/barrel-analyzer.ts#L29)

Creates a new barrel analyzer

#### Parameters

##### projectRoot

`string` = `...`

Absolute path to the project root directory

#### Returns

`BarrelAnalyzer`

## Methods

### analyzeBarrelImpact()

> **analyzeBarrelImpact**(`sourcePath`, `destPath`): `Promise`\<[`BarrelAnalysisResult`](/api/interfaces/barrelanalysisresult/)\>

Defined in: [barrel-analyzer.ts:51](https://github.com/SubtleTools/move-ts-file/blob/main/src/barrel-analyzer.ts#L51)

Analyzes what barrel exports would be affected by moving a file.

#### Parameters

##### sourcePath

`string`

The file being moved (absolute path)

##### destPath

`string`

The destination path (absolute path)

#### Returns

`Promise`\<[`BarrelAnalysisResult`](/api/interfaces/barrelanalysisresult/)\>

Analysis of affected barrel exports and transitive imports

***

### updateBarrelExports()

> **updateBarrelExports**(`barrelExports`, `newPath`): `Promise`\<`void`\>

Defined in: [barrel-analyzer.ts:196](https://github.com/SubtleTools/move-ts-file/blob/main/src/barrel-analyzer.ts#L196)

Updates barrel exports after a file has been moved

Updates the module specifiers in barrel export statements to point to the
new location of the moved file. Saves all modified files to disk.

#### Parameters

##### barrelExports

[`BarrelExport`](/api/interfaces/barrelexport/)[]

The barrel exports to update

##### newPath

`string`

The new absolute path of the moved file

#### Returns

`Promise`\<`void`\>

#### Throws

May throw if files cannot be written to disk

#### Example

```typescript
const analyzer = new BarrelAnalyzer('/project');
const analysis = await analyzer.analyzeBarrelImpact('/old/file.ts', '/new/file.ts');
await analyzer.updateBarrelExports(analysis.affectedBarrels, '/new/file.ts');
```
