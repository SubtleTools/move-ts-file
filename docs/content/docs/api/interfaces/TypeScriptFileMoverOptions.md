---
editUrl: false
next: false
prev: false
title: "TypeScriptFileMoverOptions"
---

Defined in: [move-ts.ts:47](https://github.com/SubtleTools/move-ts-file/blob/main/src/move-ts.ts#L47)

A powerful TypeScript file mover that intelligently handles import path updates.

This class provides functionality to move TypeScript files while automatically
finding and updating all import statements that reference the moved file throughout
the entire project. It supports multiple import resolution strategies including:

- Relative imports (e.g., './file', '../utils/helper')
- TypeScript path mappings from tsconfig.json (e.g., '@/components/Button')
- Node.js package imports/subpath imports (e.g., '#internal/utils')
- Complex monorepo structures with multiple tsconfig files

The tool preserves the original import style when possible and falls back to
relative imports when the original pattern can no longer be maintained.

## Example

```typescript
const mover = new TypeScriptFileMover('/path/to/project');
await mover.init();
await mover.moveFile('src/old-location.ts', 'src/new-location.ts');
```

## Properties

### debug?

> `optional` **debug**: `boolean`

Defined in: [move-ts.ts:53](https://github.com/SubtleTools/move-ts-file/blob/main/src/move-ts.ts#L53)

If true, enable debug logging for troubleshooting (default: false)

---

### dryRun?

> `optional` **dryRun**: `boolean`

Defined in: [move-ts.ts:51](https://github.com/SubtleTools/move-ts-file/blob/main/src/move-ts.ts#L51)

If true, show what would be changed without making changes (default: false)

---

### updateBarrels?

> `optional` **updateBarrels**: `boolean`

Defined in: [move-ts.ts:49](https://github.com/SubtleTools/move-ts-file/blob/main/src/move-ts.ts#L49)

Whether to update barrel exports (re-exports) when moving files (default: true)
