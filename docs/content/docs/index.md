---
title: move-ts-file
description: Intelligent CLI tool to move TypeScript files and automatically update all import paths throughout your project
template: splash
hero:
  tagline: Move TypeScript files with automatic import updates for modern development workflows
  actions:
    - text: Get Started
      link: /introduction/
      icon: right-arrow
      variant: primary
    - text: View on GitHub
      link: https://github.com/SubtleTools/move-ts-file
      icon: external
---

## What makes move-ts-file special?

### 🎯 Import Style Preservation
Maintains your existing import patterns instead of forcing you to adopt a specific style. Whether you use relative imports, path mappings, or workspace imports, move-ts-file preserves your choices.

### 📦 Monorepo Native
Built from the ground up to handle complex monorepo structures with workspace dependencies, cross-package imports, and scoped packages.

### 🤖 AI-Assisted Development
Designed specifically for AI agents and modern development workflows. Includes comprehensive Claude Code integration with custom commands.

### 🔄 Barrel Export Management
Automatically detects and updates barrel files (index.ts re-exports) when files are moved, ensuring your module structure stays intact.

### ⚡ Zero Configuration
Works out of the box with any TypeScript project. No complex configuration files or setup required.

### 🧪 Battle-Tested
Comprehensive test suite with 47+ tests covering edge cases, monorepo scenarios, and complex import patterns.

## Quick Example

```bash
# Move a file and update all imports automatically
npx move-ts-file src/utils/helper.ts src/shared/helper.ts

# Or use with bun
bunx move-ts-file src/components/Button.tsx src/ui/Button.tsx

# Works with complex paths too
move-ts-file packages/core/src/types/user.ts packages/shared/src/types/user.ts
```

Before:

```typescript
// src/components/UserCard.tsx
import { formatUser } from '@/utils/formatter';
import { helper } from '../utils/helper.js';

// src/index.ts
export { helper } from './utils/helper.js';
```

After running `move-ts-file src/utils/helper.ts src/shared/helper.ts`:

```typescript
// src/components/UserCard.tsx
import { formatUser } from '@/utils/formatter'; // ✅ Unchanged
import { helper } from '../shared/helper.js'; // ✅ Updated automatically

// src/index.ts
export { helper } from './shared/helper.js'; // ✅ Barrel export updated
```

Ready to get started? [Install move-ts-file](/installation/) and begin moving files with confidence.
