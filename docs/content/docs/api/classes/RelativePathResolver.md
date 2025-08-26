---
editUrl: false
next: false
prev: false
title: "RelativePathResolver"
---

Defined in: [path-resolver.ts:86](https://github.com/SubtleTools/move-ts-file/blob/main/src/path-resolver.ts#L86)

Resolves relative import paths

Handles imports that start with './' or '../' and resolves them relative to the importing file.

## Extends

- [`PathResolver`](/api/classes/pathresolver/)

## Constructors

### Constructor

> **new RelativePathResolver**(): `RelativePathResolver`

#### Returns

`RelativePathResolver`

#### Inherited from

[`PathResolver`](/api/classes/pathresolver/).[`constructor`](/api/classes/pathresolver/#constructor)

## Methods

### calculateNewImportPath()

> **calculateNewImportPath**(`_oldSpecifier`, `fromFile`, `newPath`): `null` \| `string`

Defined in: [path-resolver.ts:117](https://github.com/SubtleTools/move-ts-file/blob/main/src/path-resolver.ts#L117)

Calculates the new relative import path when a file is moved

#### Parameters

##### \_oldSpecifier

`string`

The original import specifier (unused for relative paths)

##### fromFile

`string`

Absolute path of the file containing the import

##### newPath

`string`

The new absolute path of the moved file

#### Returns

`null` \| `string`

New relative import specifier

#### Overrides

[`PathResolver`](/api/classes/pathresolver/).[`calculateNewImportPath`](/api/classes/pathresolver/#calculatenewimportpath)

***

### getImportType()

> **getImportType**(`specifier`, `_fromFile`): `null` \| [`ImportTypeInfo`](/api/interfaces/importtypeinfo/)

Defined in: [path-resolver.ts:148](https://github.com/SubtleTools/move-ts-file/blob/main/src/path-resolver.ts#L148)

Determines if an import is a relative import

#### Parameters

##### specifier

`string`

The import specifier to analyze

##### \_fromFile

`string`

Absolute path of the file containing the import (unused)

#### Returns

`null` \| [`ImportTypeInfo`](/api/interfaces/importtypeinfo/)

Import type information if relative, or null otherwise

#### Overrides

[`PathResolver`](/api/classes/pathresolver/).[`getImportType`](/api/classes/pathresolver/#getimporttype)

***

### resolveImportPath()

> **resolveImportPath**(`specifier`, `fromFile`): `null` \| `string`

Defined in: [path-resolver.ts:94](https://github.com/SubtleTools/move-ts-file/blob/main/src/path-resolver.ts#L94)

Resolves a relative import specifier to an absolute file path

#### Parameters

##### specifier

`string`

The import specifier (must start with '.' or '/')

##### fromFile

`string`

Absolute path of the file containing the import

#### Returns

`null` \| `string`

Absolute path of the resolved file, or null if not relative or not found

#### Overrides

[`PathResolver`](/api/classes/pathresolver/).[`resolveImportPath`](/api/classes/pathresolver/#resolveimportpath)
