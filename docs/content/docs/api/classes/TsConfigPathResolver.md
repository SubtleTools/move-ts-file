---
editUrl: false
next: false
prev: false
title: "TsConfigPathResolver"
---

Defined in: [tsconfig-path-resolver.ts:13](https://github.com/SubtleTools/move-ts-file/blob/main/src/tsconfig-path-resolver.ts#L13)

Resolves TypeScript config path mappings

Handles imports that use TypeScript path mappings defined in tsconfig.json,
such as '@/components/_' mapping to './src/components/_'. Resolves these
mapped imports to actual file paths and calculates new mappings when files move.

## Extends

- [`PathResolver`](/api/classes/pathresolver/)

## Constructors

### Constructor

> **new TsConfigPathResolver**(`tsConfigPaths`): `TsConfigPathResolver`

Defined in: [tsconfig-path-resolver.ts:19](https://github.com/SubtleTools/move-ts-file/blob/main/src/tsconfig-path-resolver.ts#L19)

Creates a new TsConfig path resolver

#### Parameters

##### tsConfigPaths

`Map`\<`string`, [`PathMappingInfo`](/api/interfaces/pathmappinginfo/)[]\>

Map of path mappings loaded from tsconfig.json files

#### Returns

`TsConfigPathResolver`

#### Overrides

[`PathResolver`](/api/classes/pathresolver/).[`constructor`](/api/classes/pathresolver/#constructor)

## Methods

### calculateNewImportPath()

> **calculateNewImportPath**(`oldSpecifier`, `_fromFile`, `newPath`): `null` \| `string`

Defined in: [tsconfig-path-resolver.ts:52](https://github.com/SubtleTools/move-ts-file/blob/main/src/tsconfig-path-resolver.ts#L52)

Calculates the new TypeScript path mapping import when a file is moved

#### Parameters

##### oldSpecifier

`string`

The original import specifier

##### \_fromFile

`string`

Absolute path of the file containing the import (unused)

##### newPath

`string`

The new absolute path of the moved file

#### Returns

`null` \| `string`

New path mapping specifier, or null if path doesn't fit any mapping

#### Overrides

[`PathResolver`](/api/classes/pathresolver/).[`calculateNewImportPath`](/api/classes/pathresolver/#calculatenewimportpath)

---

### getImportType()

> **getImportType**(`specifier`, `_fromFile`): `null` \| [`ImportTypeInfo`](/api/interfaces/importtypeinfo/)

Defined in: [tsconfig-path-resolver.ts:70](https://github.com/SubtleTools/move-ts-file/blob/main/src/tsconfig-path-resolver.ts#L70)

Determines if an import uses TypeScript path mappings

#### Parameters

##### specifier

`string`

The import specifier to analyze

##### \_fromFile

`string`

Absolute path of the file containing the import (unused)

#### Returns

`null` \| [`ImportTypeInfo`](/api/interfaces/importtypeinfo/)

Import type information if it's a tsconfig path, or null otherwise

#### Overrides

[`PathResolver`](/api/classes/pathresolver/).[`getImportType`](/api/classes/pathresolver/#getimporttype)

---

### resolveImportPath()

> **resolveImportPath**(`specifier`, `_fromFile`): `null` \| `string`

Defined in: [tsconfig-path-resolver.ts:30](https://github.com/SubtleTools/move-ts-file/blob/main/src/tsconfig-path-resolver.ts#L30)

Resolves a TypeScript path mapping import to an absolute file path

#### Parameters

##### specifier

`string`

The import specifier (e.g., '@/components/Button')

##### \_fromFile

`string`

Absolute path of the file containing the import (unused)

#### Returns

`null` \| `string`

Absolute path of the resolved file, or null if not a tsconfig path

#### Overrides

[`PathResolver`](/api/classes/pathresolver/).[`resolveImportPath`](/api/classes/pathresolver/#resolveimportpath)
