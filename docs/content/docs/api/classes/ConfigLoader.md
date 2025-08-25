---
editUrl: false
next: false
prev: false
title: "ConfigLoader"
---

Defined in: [config-loader.ts:14](https://github.com/SubtleTools/move-ts-file/blob/main/src/config-loader.ts#L14)

Loads configuration from tsconfig.json and package.json files

This class scans the project directory for configuration files and extracts
TypeScript path mappings and Node.js package imports that are used for
resolving import statements.

## Constructors

### Constructor

> **new ConfigLoader**(`projectRoot`): `ConfigLoader`

Defined in: [config-loader.ts:20](https://github.com/SubtleTools/move-ts-file/blob/main/src/config-loader.ts#L20)

Creates a new ConfigLoader instance

#### Parameters

##### projectRoot

`string`

Absolute path to the project root directory

#### Returns

`ConfigLoader`

## Methods

### loadPackageImports()

> **loadPackageImports**(): `Promise`\<[`PackageImportsInfo`](/api/interfaces/packageimportsinfo/)[]\>

Defined in: [config-loader.ts:98](https://github.com/SubtleTools/move-ts-file/blob/main/src/config-loader.ts#L98)

Loads Node.js package imports from all package.json files in the project

Scans for all package.json files and extracts the 'imports' field which defines
Node.js subpath imports (imports that start with '#'). These are used to resolve
imports like '#internal/utils' to actual file paths.

#### Returns

`Promise`\<[`PackageImportsInfo`](/api/interfaces/packageimportsinfo/)[]\>

Array of package imports information from all package.json files

#### Throws

Logs warnings for invalid package.json files but continues processing

#### Example

```typescript
const loader = new ConfigLoader('/project');
const imports = await loader.loadPackageImports();
// imports[0].imports.get('#internal/*') might return './src/internal/*'
```

---

### loadTsConfigPaths()

> **loadTsConfigPaths**(): `Promise`\<`Map`\<`string`, [`PathMappingInfo`](/api/interfaces/pathmappinginfo/)[]\>\>

Defined in: [config-loader.ts:39](https://github.com/SubtleTools/move-ts-file/blob/main/src/config-loader.ts#L39)

Loads TypeScript path mappings from all tsconfig.json files in the project

Scans for all tsconfig*.json files and extracts the 'paths' configuration
from the compilerOptions. These path mappings are used to resolve imports
like '@/components/*' to actual file paths.

#### Returns

`Promise`\<`Map`\<`string`, [`PathMappingInfo`](/api/interfaces/pathmappinginfo/)[]\>\>

Map where keys are alias patterns and values are arrays of path mapping info

#### Throws

Logs warnings for invalid tsconfig.json files but continues processing

#### Example

```typescript
const loader = new ConfigLoader('/project');
const paths = await loader.loadTsConfigPaths();
// paths.get('@/*') might return [{ alias: '@/*', pathPattern: './src/', ... }]
```
