# move-ts-file

[![npm version](https://badge.fury.io/js/move-ts-file.svg)](https://badge.fury.io/js/move-ts-file)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Intelligent CLI tool to move TypeScript files and automatically update all import paths throughout your project.**

Perfect for refactoring TypeScript projects, especially when working with AI coding assistants like [Claude Code](https://claude.ai/code), Cursor, GitHub Copilot, or other automated refactoring tools.

## 🚀 Why move-ts-file?

When refactoring TypeScript projects—whether manually or with AI assistance—moving files often breaks import paths throughout your codebase. This tool solves that problem by:

- **🔍 Finding all references** to your moved files across the entire project
- **🎯 Preserving import styles** (relative, tsconfig paths, package imports)
- **🧠 Understanding complex setups** (monorepos, multiple tsconfigs, custom path mappings)
- **⚡ Working instantly** with zero configuration needed

### Perfect for AI-Assisted Development

AI coding assistants like **Claude Code** excel at understanding code structure and suggesting refactoring, but they often struggle with the tedious task of updating import paths when files are moved. This tool bridges that gap:

- **AI suggests** → "Move this component to a shared directory"
- **You execute** → `move-ts-file src/components/Button.tsx shared/ui/Button.tsx`
- **Tool handles** → All import updates across your entire codebase

## 📦 Installation

```bash
npm install -g move-ts-file
```

Or use directly with npx:

```bash
npx move-ts-file <source> <destination>
```

## 🎯 Usage

### Basic Syntax

```bash
move-ts-file <source-file> <destination>
```

### Examples

**Move a file to a different directory:**

```bash
move-ts-file src/components/Button.tsx src/ui/Button.tsx
```

**Move and rename simultaneously:**

```bash
move-ts-file utils/helper.ts lib/utils/string-helper.ts
```

**Reorganize into feature directories:**

```bash
move-ts-file src/UserManager.tsx src/features/user-management/UserManager.tsx
```

**Move shared utilities:**

```bash
move-ts-file packages/app/src/utils/validation.ts packages/shared/src/validation.ts
```

## ✨ Features

### 🎯 Smart Import Resolution

Supports all TypeScript import patterns:

- **Relative imports**: `'./file'`, `'../utils/helper'`
- **TypeScript path mappings**: `'@/components/Button'`, `'@utils/validation'`
- **Node.js package imports**: `'#internal/utils'`, `'#shared/components'`
- **Monorepo imports**: Cross-package references in complex monorepos

### 🧠 Intelligent Path Preservation

The tool is smart about maintaining your existing import patterns:

- **Relative imports stay relative** when possible
- **Path mappings are preserved** if the new location still fits the pattern
- **Graceful fallback** to relative imports when patterns no longer match
- **No forced conversions** between import styles

### 🔍 Comprehensive File Discovery

Automatically finds and updates imports in:

- **All TypeScript files** (`.ts`, `.tsx`) in your project
- **Test files** with proper path resolution
- **Configuration files** that might reference moved modules
- **Monorepo packages** with cross-package dependencies

### ⚡ Zero Configuration

Works immediately with:

- **Any TypeScript project structure**
- **Multiple tsconfig.json files** (monorepos, workspaces)
- **Complex path mappings** and baseUrl configurations
- **Package.json imports** and subpath patterns

## 🏗️ Advanced Scenarios

### Monorepo Support

Perfect for monorepos with complex import structures:

```bash
# Move between packages
move-ts-file packages/ui/src/Button.tsx packages/design-system/src/components/Button.tsx

# Reorganize shared utilities
move-ts-file apps/web/src/utils/api.ts packages/shared/src/api-client.ts
```

### TypeScript Path Mapping

Seamlessly handles tsconfig.json path mappings:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@utils/*": ["./src/utils/*"]
    }
  }
}
```

```bash
# Moves while preserving @ imports
move-ts-file src/components/Button.tsx src/ui/components/Button.tsx
# Updates: import Button from '@/components/Button' → '@/ui/components/Button'
```

### Package Imports (Node.js Subpath Imports)

Supports modern Node.js package import patterns:

```json
{
  "imports": {
    "#internal/*": "./src/internal/*",
    "#shared/*": "./src/shared/*"
  }
}
```

```bash
# Maintains package import patterns when possible
move-ts-file src/internal/utils.ts src/shared/utils.ts
# Updates: import utils from '#internal/utils' → '#shared/utils'
```

## 🤖 Integration with AI Coding Assistants

### Claude Code Integration

This tool is specifically designed to work seamlessly with AI coding assistants. Here's how to use it with Claude Code:

1. **Ask Claude to analyze** your codebase and suggest refactoring
2. **Ask Claude to identify** which files should be moved
3. **Use this tool** to execute the moves with confidence
4. **Let Claude continue** with the refactoring, knowing imports are correct

**Example workflow:**

```
You: "I want to reorganize my components into feature-based directories"
Claude: "I recommend moving Button.tsx to features/ui/Button.tsx"
You: move-ts-file src/components/Button.tsx src/features/ui/Button.tsx
Claude: "Great! Now let's move the related hook..."
```

### Integration with Other Tools

Works great with:

- **Cursor**: Execute moves suggested by AI
- **GitHub Copilot**: Clean up after AI-generated refactoring
- **TypeScript Language Server**: Maintains project integrity
- **ESLint/Prettier**: No import style violations

## 📊 Example Output

```bash
$ move-ts-file src/utils/helper.ts src/lib/shared/helper.ts

Moving src/utils/helper.ts to src/lib/shared/helper.ts
Updated imports in: src/components/UserCard.tsx
Updated imports in: src/services/api-client.ts
Updated imports in: src/hooks/useValidation.ts
Updated imports in: test/utils/helper.test.ts
Updated imports in: packages/admin/src/UserManager.tsx
Successfully moved file and updated 5 files with import changes
```

## 🎯 Use Cases

### Perfect For

- **Large-scale refactoring** projects
- **AI-assisted development** workflows
- **Monorepo reorganization**
- **Feature-based architecture** adoption
- **Code cleanup and modernization**
- **Team onboarding** (consistent project structure)

### Common Scenarios

- Moving shared utilities to a common package
- Reorganizing components by feature
- Extracting reusable code to libraries
- Cleaning up legacy project structure
- Preparing code for migration (Next.js, Vite, etc.)

## 🔧 How It Works

1. **Parse project configuration**: Loads all tsconfig.json and package.json files
2. **Analyze import patterns**: Uses TypeScript AST to understand import structures
3. **Find affected files**: Scans entire project for files importing the source
4. **Calculate new paths**: Determines optimal import path for each reference
5. **Update atomically**: Moves file and updates all imports in one operation
6. **Preserve styles**: Maintains original import patterns when possible

## 🚫 Limitations

- Only works with TypeScript files (`.ts`, `.tsx`)
- Does not handle dynamic imports (`import()`) or `require()`
- Requires valid TypeScript syntax for parsing
- Does not update comments or documentation references

## 🤝 Contributing

Contributions welcome! Please read our [contributing guidelines](https://github.com/SubtleTools/move-ts-file/blob/main/CONTRIBUTING.md) and submit pull requests to our [GitHub repository](https://github.com/SubtleTools/move-ts-file).

## 📄 License

MIT License - see [LICENSE](https://github.com/SubtleTools/move-ts-file/blob/main/LICENSE) file for details.

## 🙋 Support

- **Issues**: [GitHub Issues](https://github.com/SubtleTools/move-ts-file/issues)
- **Discussions**: [GitHub Discussions](https://github.com/SubtleTools/move-ts-file/discussions)
- **Author**: [Saulo Vallory](https://saulo.engineer)

---

**Made with ❤️ for the TypeScript and AI-assisted development community**
