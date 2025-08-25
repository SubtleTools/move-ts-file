---
editUrl: false
next: false
prev: false
title: "PathMappingInfo"
---

Defined in: [types.ts:39](https://github.com/SubtleTools/move-ts-file/blob/main/src/types.ts#L39)

Information about a TypeScript path mapping configuration from tsconfig.json.
Used to resolve imports that use tsconfig path mappings like '@/components/*'.

## Properties

### alias

> **alias**: `string`

Defined in: [types.ts:41](https://github.com/SubtleTools/move-ts-file/blob/main/src/types.ts#L41)

The original alias pattern from tsconfig.json (e.g., '@/components/*')

---

### aliasPattern

> **aliasPattern**: `string`

Defined in: [types.ts:43](https://github.com/SubtleTools/move-ts-file/blob/main/src/types.ts#L43)

The alias pattern without wildcards (e.g., '@/components/')

---

### basePath

> **basePath**: `string`

Defined in: [types.ts:47](https://github.com/SubtleTools/move-ts-file/blob/main/src/types.ts#L47)

Absolute base path for resolving relative paths

---

### pathPattern

> **pathPattern**: `string`

Defined in: [types.ts:45](https://github.com/SubtleTools/move-ts-file/blob/main/src/types.ts#L45)

The path pattern it maps to (e.g., './src/components/')
