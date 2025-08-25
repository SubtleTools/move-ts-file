---
title: Getting Started
description: Learn how to install and use move-ts-file to move TypeScript files with automatic import updates
---

# Getting Started

**move-ts-file** is an intelligent CLI tool that moves TypeScript files while automatically updating all import paths throughout your project. Perfect for refactoring and AI-assisted development.

## Installation

### Global Installation

```bash
npm install -g move-ts-file
```

Or with your preferred package manager:

```bash
# Using yarn
yarn global add move-ts-file

# Using pnpm
pnpm add -g move-ts-file

# Using bun
bun add -g move-ts-file
```

### One-time Usage

If you don't want to install globally, you can use it directly:

```bash
npx move-ts-file <source> <destination>
# or
bunx move-ts-file <source> <destination>
```

## Basic Usage

The basic syntax is simple:

```bash
move-ts-file <source-file> <destination>
```

### Examples

**Move a file to a different directory:**
```bash
move-ts-file src/components/Button.tsx src/ui/Button.tsx
```

**Move to a directory (keeps the same filename):**
```bash
move-ts-file src/utils/helper.ts shared/
# Results in: shared/helper.ts
```

**Move and rename simultaneously:**
```bash
move-ts-file utils/helper.ts lib/string-helper.ts
```

**Reorganize into feature directories:**
```bash
move-ts-file src/UserManager.tsx src/features/user-management/UserManager.tsx
```

## What Gets Updated

When you move a file, move-ts-file automatically:

- **Finds all references** to the moved file across your entire project
- **Updates import statements** in all affected files
- **Preserves your import style** (relative, tsconfig paths, workspace imports)
- **Updates barrel exports** (index.ts files) if applicable
- **Maintains TypeScript compliance** throughout the process

## Command Options

```bash
move-ts-file <source> <destination> [options]
```

### Options

- `--no-update-barrels` - Disable automatic barrel export updates (default: enabled)

### Examples with Options

```bash
# Default behavior - updates barrel exports automatically
move-ts-file src/utils/helper.ts src/shared/helper.ts

# Disable barrel updates if you prefer manual control
move-ts-file src/utils/helper.ts src/shared/helper.ts --no-update-barrels
```

## Project Support

move-ts-file works with:

- ✅ **Any TypeScript project** (.ts and .tsx files)
- ✅ **Monorepos** with multiple packages
- ✅ **Complex tsconfig.json** setups with path mappings
- ✅ **Workspace dependencies** (npm, yarn, pnpm, bun workspaces)
- ✅ **Node.js package imports** (subpath imports with # prefix)
- ✅ **Barrel exports** (index.ts re-export files)

## Next Steps

Now that you have move-ts-file installed:

- Learn about [Advanced Features](/features/) like monorepo support
- See [AI Integration](/ai-integration/) for Claude Code workflows  
- Check out [Examples](/examples/) for common use cases
- Read about [How It Works](/how-it-works/) under the hood

Ready to start moving files? Try it on a simple file first:

```bash
move-ts-file src/utils/example.ts src/shared/example.ts
```