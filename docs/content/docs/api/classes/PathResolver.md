---
editUrl: false
next: false
prev: false
title: "PathResolver"
---

Defined in: [path-resolver.ts:11](https://github.com/SubtleTools/move-ts-file/blob/main/src/path-resolver.ts#L11)

Base class for path resolution strategies

Provides a common interface for resolving different types of import paths
and calculating new import paths when files are moved.

## Extended by

- [`PackageImportsResolver`](/api/classes/packageimportsresolver/)
- [`RelativePathResolver`](/api/classes/relativepathresolver/)
- [`TsConfigPathResolver`](/api/classes/tsconfigpathresolver/)

## Constructors

### Constructor

> **new PathResolver**(): `PathResolver`

#### Returns

`PathResolver`

## Methods

### calculateNewImportPath()

> `abstract` **calculateNewImportPath**(`oldSpecifier`, `fromFile`, `newPath`): `null` \| `string`

Defined in: [path-resolver.ts:29](https://github.com/SubtleTools/move-ts-file/blob/main/src/path-resolver.ts#L29)

Calculates the new import path when a file is moved

#### Parameters

##### oldSpecifier

`string`

The original import specifier

##### fromFile

`string`

Absolute path of the file containing the import

##### newPath

`string`

The new absolute path of the moved file

#### Returns

`null` \| `string`

New import specifier, or null if cannot be calculated

***

### getImportType()

> `abstract` **getImportType**(`specifier`, `fromFile`): `null` \| [`ImportTypeInfo`](/api/interfaces/importtypeinfo/)

Defined in: [path-resolver.ts:42](https://github.com/SubtleTools/move-ts-file/blob/main/src/path-resolver.ts#L42)

Determines the type of import and provides context information

#### Parameters

##### specifier

`string`

The import specifier to analyze

##### fromFile

`string`

Absolute path of the file containing the import

#### Returns

`null` \| [`ImportTypeInfo`](/api/interfaces/importtypeinfo/)

Import type information, or null if not handled by this resolver

***

### resolveImportPath()

> `abstract` **resolveImportPath**(`specifier`, `fromFile`): `null` \| `string`

Defined in: [path-resolver.ts:19](https://github.com/SubtleTools/move-ts-file/blob/main/src/path-resolver.ts#L19)

Resolves an import specifier to an absolute file path

#### Parameters

##### specifier

`string`

The import specifier to resolve (e.g., './file', '@/components/Button')

##### fromFile

`string`

Absolute path of the file containing the import

#### Returns

`null` \| `string`

Absolute path of the resolved file, or null if not resolvable
