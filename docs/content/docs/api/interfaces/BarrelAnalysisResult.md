---
editUrl: false
next: false
prev: false
title: "BarrelAnalysisResult"
---

Defined in: [types.ts:104](https://github.com/SubtleTools/move-ts-file/blob/main/src/types.ts#L104)

Result of analyzing barrel exports that would be affected by moving a file

## Properties

### affectedBarrels

> **affectedBarrels**: [`BarrelExport`](/api/interfaces/barrelexport/)[]

Defined in: [types.ts:106](https://github.com/SubtleTools/move-ts-file/blob/main/src/types.ts#L106)

Barrel exports that directly re-export from the moved file

***

### shouldUpdateBarrels

> **shouldUpdateBarrels**: `boolean`

Defined in: [types.ts:110](https://github.com/SubtleTools/move-ts-file/blob/main/src/types.ts#L110)

Whether barrel exports need to be updated

***

### transitiveImports

> **transitiveImports**: `string`[]

Defined in: [types.ts:108](https://github.com/SubtleTools/move-ts-file/blob/main/src/types.ts#L108)

Files that transitively import through the affected barrels
