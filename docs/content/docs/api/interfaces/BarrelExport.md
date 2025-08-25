---
editUrl: false
next: false
prev: false
title: "BarrelExport"
---

Defined in: [types.ts:84](https://github.com/SubtleTools/move-ts-file/blob/main/src/types.ts#L84)

Represents a barrel export (re-export) that would be affected by moving a file

## Properties

### exportDeclaration

> **exportDeclaration**: `string`

Defined in: [types.ts:88](https://github.com/SubtleTools/move-ts-file/blob/main/src/types.ts#L88)

The full text of the export declaration

---

### exportDeclarationNode

> **exportDeclarationNode**: `any`

Defined in: [types.ts:98](https://github.com/SubtleTools/move-ts-file/blob/main/src/types.ts#L98)

Reference to the ts-morph ExportDeclaration node for updating

---

### filePath

> **filePath**: `string`

Defined in: [types.ts:86](https://github.com/SubtleTools/move-ts-file/blob/main/src/types.ts#L86)

Absolute path to the barrel file containing the re-export

---

### hasStarExport

> **hasStarExport**: `boolean`

Defined in: [types.ts:96](https://github.com/SubtleTools/move-ts-file/blob/main/src/types.ts#L96)

Whether this is a star export (export *)

---

### moduleSpecifier

> **moduleSpecifier**: `string`

Defined in: [types.ts:90](https://github.com/SubtleTools/move-ts-file/blob/main/src/types.ts#L90)

The module specifier being re-exported from

---

### namedExports

> **namedExports**: [`NamedExport`](/api/interfaces/namedexport/)[]

Defined in: [types.ts:94](https://github.com/SubtleTools/move-ts-file/blob/main/src/types.ts#L94)

Named exports (if any)

---

### resolvedPath

> **resolvedPath**: `string`

Defined in: [types.ts:92](https://github.com/SubtleTools/move-ts-file/blob/main/src/types.ts#L92)

Resolved absolute path of the module being re-exported
