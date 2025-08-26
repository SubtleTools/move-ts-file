---
editUrl: false
next: false
prev: false
title: "FileUpdate"
---

Defined in: [types.ts:26](https://github.com/SubtleTools/move-ts-file/blob/main/src/types.ts#L26)

Represents a file that needs import updates after a TypeScript file is moved.
Contains the file content and all import references that need updating.

## Properties

### content

> **content**: `string`

Defined in: [types.ts:30](https://github.com/SubtleTools/move-ts-file/blob/main/src/types.ts#L30)

Current content of the file

***

### filePath

> **filePath**: `string`

Defined in: [types.ts:28](https://github.com/SubtleTools/move-ts-file/blob/main/src/types.ts#L28)

Absolute path to the file that needs updating

***

### references

> **references**: [`ImportReference`](/api/interfaces/importreference/)[]

Defined in: [types.ts:32](https://github.com/SubtleTools/move-ts-file/blob/main/src/types.ts#L32)

List of import references in this file that need updating
