---
editUrl: false
next: false
prev: false
title: "ImportTypeInfo"
---

Defined in: [types.ts:64](https://github.com/SubtleTools/move-ts-file/blob/main/src/types.ts#L64)

Result of analyzing an import specifier to determine its type and context

## Properties

### packageInfo?

> `optional` **packageInfo**: [`PackageImportsInfo`](/api/interfaces/packageimportsinfo/)

Defined in: [types.ts:67](https://github.com/SubtleTools/move-ts-file/blob/main/src/types.ts#L67)

---

### packageName?

> `optional` **packageName**: `string`

Defined in: [types.ts:68](https://github.com/SubtleTools/move-ts-file/blob/main/src/types.ts#L68)

---

### pathInfo?

> `optional` **pathInfo**: [`PathMappingInfo`](/api/interfaces/pathmappinginfo/)

Defined in: [types.ts:66](https://github.com/SubtleTools/move-ts-file/blob/main/src/types.ts#L66)

---

### type

> **type**: `"tsconfig"` \| `"package"` \| `"relative"` \| `"workspace"`

Defined in: [types.ts:65](https://github.com/SubtleTools/move-ts-file/blob/main/src/types.ts#L65)
