---
editUrl: false
next: false
prev: false
title: "PackageImportsResolver"
---

Defined in: [package-imports-resolver.ts:13](https://github.com/SubtleTools/move-ts-file/blob/main/src/package-imports-resolver.ts#L13)

Resolves Node.js package imports (subpath imports)

Handles imports that start with '#' which are Node.js subpath imports defined
in package.json files. These are used for internal module resolution within
packages, such as '#internal/utils' mapping to './src/internal/utils.js'.

## Extends

- [`PathResolver`](/api/classes/pathresolver/)

## Constructors

### Constructor

> **new PackageImportsResolver**(`packageImports`): `PackageImportsResolver`

Defined in: [package-imports-resolver.ts:19](https://github.com/SubtleTools/move-ts-file/blob/main/src/package-imports-resolver.ts#L19)

Creates a new package imports resolver

#### Parameters

##### packageImports

[`PackageImportsInfo`](/api/interfaces/packageimportsinfo/)[]

Array of package imports information from package.json files

#### Returns

`PackageImportsResolver`

#### Overrides

[`PathResolver`](/api/classes/pathresolver/).[`constructor`](/api/classes/pathresolver/#constructor)

## Methods

### calculateNewImportPath()

> **calculateNewImportPath**(`oldSpecifier`, `fromFile`, `newPath`): `null` \| `string`

Defined in: [package-imports-resolver.ts:64](https://github.com/SubtleTools/move-ts-file/blob/main/src/package-imports-resolver.ts#L64)

Calculates the new package import path when a file is moved

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

New package import specifier, or null if doesn't fit pattern

#### Overrides

[`PathResolver`](/api/classes/pathresolver/).[`calculateNewImportPath`](/api/classes/pathresolver/#calculatenewimportpath)

---

### getImportType()

> **getImportType**(`specifier`, `fromFile`): `null` \| [`ImportTypeInfo`](/api/interfaces/importtypeinfo/)

Defined in: [package-imports-resolver.ts:82](https://github.com/SubtleTools/move-ts-file/blob/main/src/package-imports-resolver.ts#L82)

Determines if an import is a package import

#### Parameters

##### specifier

`string`

The import specifier to analyze

##### fromFile

`string`

Absolute path of the file containing the import

#### Returns

`null` \| [`ImportTypeInfo`](/api/interfaces/importtypeinfo/)

Import type information if it's a package import, or null otherwise

#### Overrides

[`PathResolver`](/api/classes/pathresolver/).[`getImportType`](/api/classes/pathresolver/#getimporttype)

---

### resolveImportPath()

> **resolveImportPath**(`specifier`, `fromFile`): `null` \| `string`

Defined in: [package-imports-resolver.ts:30](https://github.com/SubtleTools/move-ts-file/blob/main/src/package-imports-resolver.ts#L30)

Resolves a package import specifier to an absolute file path

#### Parameters

##### specifier

`string`

The import specifier (must start with '#')

##### fromFile

`string`

Absolute path of the file containing the import

#### Returns

`null` \| `string`

Absolute path of the resolved file, or null if not a package import

#### Overrides

[`PathResolver`](/api/classes/pathresolver/).[`resolveImportPath`](/api/classes/pathresolver/#resolveimportpath)
