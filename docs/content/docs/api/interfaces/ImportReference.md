---
editUrl: false
next: false
prev: false
title: "ImportReference"
---

Defined in: [types.ts:9](https://github.com/SubtleTools/move-ts-file/blob/main/src/types.ts#L9)

Represents a reference to an import or export statement in a TypeScript file.
Used to track import locations for updating when files are moved.

## Properties

### end

> **end**: `number`

Defined in: [types.ts:15](https://github.com/SubtleTools/move-ts-file/blob/main/src/types.ts#L15)

End position of the import specifier in the source file

***

### isExport

> **isExport**: `boolean`

Defined in: [types.ts:17](https://github.com/SubtleTools/move-ts-file/blob/main/src/types.ts#L17)

Whether this is an export re-export statement

***

### newPath?

> `optional` **newPath**: `string`

Defined in: [types.ts:19](https://github.com/SubtleTools/move-ts-file/blob/main/src/types.ts#L19)

New file path after moving (used during update calculation)

***

### specifier

> **specifier**: `string`

Defined in: [types.ts:11](https://github.com/SubtleTools/move-ts-file/blob/main/src/types.ts#L11)

The import specifier string (e.g., './file', '@/components/Button')

***

### start

> **start**: `number`

Defined in: [types.ts:13](https://github.com/SubtleTools/move-ts-file/blob/main/src/types.ts#L13)

Start position of the import specifier in the source file
