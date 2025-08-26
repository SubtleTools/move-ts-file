---
editUrl: false
next: false
prev: false
title: "PackageImportsInfo"
---

Defined in: [types.ts:54](https://github.com/SubtleTools/move-ts-file/blob/main/src/types.ts#L54)

Information about Node.js package imports (subpath imports) from package.json.
Used to resolve imports that start with '#' like '#internal/utils'.

## Properties

### imports

> **imports**: `Map`\<`string`, `string` \| `string`[]\>

Defined in: [types.ts:56](https://github.com/SubtleTools/move-ts-file/blob/main/src/types.ts#L56)

Map of import patterns to their resolved paths

***

### packageRoot

> **packageRoot**: `string`

Defined in: [types.ts:58](https://github.com/SubtleTools/move-ts-file/blob/main/src/types.ts#L58)

Root directory containing the package.json with imports
