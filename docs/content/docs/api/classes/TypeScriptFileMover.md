---
editUrl: false
next: false
prev: false
title: "TypeScriptFileMover"
---

Defined in: [move-ts.ts:56](https://github.com/SubtleTools/move-ts-file/blob/main/src/move-ts.ts#L56)

## Constructors

### Constructor

> **new TypeScriptFileMover**(`projectRoot`, `options`): `TypeScriptFileMover`

Defined in: [move-ts.ts:81](https://github.com/SubtleTools/move-ts-file/blob/main/src/move-ts.ts#L81)

Creates a new TypeScript file mover instance.

#### Parameters

##### projectRoot

`string` = `...`

Root directory of the TypeScript project. Defaults to current working directory.

##### options

[`TypeScriptFileMoverOptions`](/api/interfaces/typescriptfilemoveroptions/) = `{}`

Configuration options for the file mover

#### Returns

`TypeScriptFileMover`

## Methods

### init()

> **init**(): `Promise`\<`void`\>

Defined in: [move-ts.ts:106](https://github.com/SubtleTools/move-ts-file/blob/main/src/move-ts.ts#L106)

Initializes the TypeScript file mover by loading configuration from tsconfig.json
and package.json files throughout the project.

This method must be called before using moveFile(). It scans for all tsconfig.json
and package.json files in the project to understand path mappings and import configurations.

#### Returns

`Promise`\<`void`\>

#### Throws

If configuration files cannot be parsed

---

### moveFile()

> **moveFile**(`sourcePath`, `destPath`): `Promise`\<`void`\>

Defined in: [move-ts.ts:161](https://github.com/SubtleTools/move-ts-file/blob/main/src/move-ts.ts#L161)

Moves a TypeScript file and automatically updates all import paths throughout the project.

This is the main method that orchestrates the entire file moving process:

1. Validates the source file exists and is a TypeScript file
2. Finds all files in the project that import the source file
3. Moves the source file to the destination
4. Updates all import statements to point to the new location
5. Reports which files were updated

#### Parameters

##### sourcePath

`string`

Path to the source TypeScript file to move (relative to project root)

##### destPath

`string`

Path to the destination location (relative to project root)

#### Returns

`Promise`\<`void`\>

#### Throws

If source file doesn't exist, isn't a TypeScript file, or destination already exists

#### Example

```typescript
await mover.moveFile('src/utils/helper.ts', 'src/lib/helper.ts');
```
