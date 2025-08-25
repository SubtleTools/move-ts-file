# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2025-08-25

### Added

- `--debug` CLI option for troubleshooting and performance monitoring
- Comprehensive debug logging with memory usage tracking and progress reporting
- `--dry-run` CLI option to preview changes without making modifications
- Recursive barrel handling system for complex barrel re-export chains
- Smart import updates for barrel consumers

### Fixed

- **CRITICAL**: Fixed memory leak causing "JavaScript heap out of memory" crashes on large projects
- Fixed barrel analyzers to use on-demand file loading instead of loading all files at initialization
- Fixed barrel export updates not persisting to disk when using on-demand loading
- Improved memory efficiency for projects with thousands of TypeScript files

### Changed

- Barrel analyzers now process files on-demand with automatic memory cleanup
- Memory usage reduced from 4GB+ (causing crashes) to ~600MB peak for large projects
- Improved scalability for projects with 2,000+ TypeScript files

### Performance

- Initialization memory usage reduced by 95% (from 370MB to 2MB increase)
- Large project processing now completes successfully instead of crashing
- Memory usage stays bounded regardless of project size

## [0.2.4] - 2025-01-15

### Fixed

- Fixed barrel roll index updates
- Properly handle directory destinations in CLI

### Added

- Comprehensive tests for directory destination support

## [0.2.3] - 2025-01-14

### Changed

- Separated CLI wrapper from library code for better modularity

## [0.2.2] - 2025-01-14

### Fixed

- Fixed CLI binary execution when globally installed

## [0.2.1] - 2025-01-14

### Fixed

- CLI detection now works for both bundled and unbundled code
- CLI binary not executing when globally installed
- Added missing test fixture files and updated docs workflow

### Documentation

- Improved README AI use case examples
- Fixed documentation site rendering issues
- Converted documentation files to MDX for proper component rendering
- Added comprehensive barrel functionality explanations
- Improved Getting Started guide with Tabs components

### Infrastructure

- Updated documentation workflow
- Enhanced documentation site with better navigation
- Added CNAME file for custom domain (move-ts-file.saulo.engineer)

## [0.2.0] - 2025-01-13

### Added

- Barrel export management system
- Support for complex barrel re-export patterns
- Monorepo workspace support
- TypeScript path mapping support
- Package.json imports resolution
- Comprehensive test suite covering various import patterns

### Enhanced

- Import resolution with multiple strategies
- Support for mixed import patterns
- Deep nested directory handling
- Cross-package imports in monorepos

## [0.1.0] - 2025-01-12

### Added

- Initial release
- Basic TypeScript file moving functionality
- Automatic import path updates
- Support for relative imports
- CLI interface
- Core project structure

---

## Migration Guide

### Upgrading to v0.3.0

The new version includes significant performance improvements and new features:

1. **New CLI Options**: The `--debug` and `--dry-run` options are now available for better workflow control
2. **Memory Efficiency**: Large projects that previously crashed will now work seamlessly
3. **Enhanced Barrel Support**: Improved handling of complex barrel re-export chains

No breaking changes - all existing functionality remains the same.

### Performance Improvements

Projects with 1,000+ TypeScript files will see:

- Elimination of out-of-memory crashes
- 95% reduction in memory usage during initialization
- Bounded memory usage regardless of project size
- Faster processing of large codebases
