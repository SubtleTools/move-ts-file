import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightImageZoom from 'starlight-image-zoom';

// https://astro.build/config
export default defineConfig({
  site: 'https://subtletools.github.io',
  base: '/move-ts-file',
  integrations: [
    starlight({
      plugins: [
        // Add image zoom functionality
        starlightImageZoom({}),
      ],
      title: 'move-ts-file',
      description: 'Intelligent CLI tool to move TypeScript files and automatically update all import paths throughout your project',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/SubtleTools/move-ts-file',
        },
      ],
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Introduction', link: '/introduction/' },
            { label: 'Installation', link: '/installation/' },
            { label: 'Quick Start', link: '/quick-start/' },
          ],
        },
        {
          label: 'Features',
          items: [
            { label: 'Import Style Preservation', link: '/features/import-styles/' },
            { label: 'Path Mappings', link: '/features/path-mappings/' },
            { label: 'Monorepo Support', link: '/features/monorepo/' },
            { label: 'Barrel Exports', link: '/features/barrel-exports/' },
          ],
        },
        {
          label: 'Claude Integration',
          items: [
            { label: 'CLAUDE.md Setup', link: '/claude/claude-md/' },
            { label: 'Claude Commands', link: '/claude/commands/' },
            { label: 'AI-Assisted Refactoring', link: '/claude/refactoring/' },
          ],
        },
        {
          label: 'Configuration',
          items: [
            { label: 'TypeScript Config', link: '/config/tsconfig/' },
            { label: 'Package.json Imports', link: '/config/package-imports/' },
            { label: 'Monorepo Setup', link: '/config/monorepo/' },
          ],
        },
        {
          label: 'API Reference',
          items: [
            { label: 'TypeScriptFileMover', link: '/api/typescript-file-mover/' },
            { label: 'Configuration Options', link: '/api/options/' },
          ],
        },
        {
          label: 'Examples',
          items: [
            { label: 'Basic Usage', link: '/examples/basic/' },
            { label: 'Monorepo Example', link: '/examples/monorepo/' },
            { label: 'CI/CD Integration', link: '/examples/cicd/' },
          ],
        },
      ],
      editLink: {
        baseUrl: 'https://github.com/SubtleTools/move-ts-file/edit/main/',
      },
      lastUpdated: true,
      favicon: '/favicon.ico',
      head: [
        {
          tag: 'meta',
          attrs: {
            property: 'og:image',
            content: 'https://subtletools.github.io/move-ts-file/og-image.png',
          },
        },
        {
          tag: 'meta',
          attrs: {
            name: 'twitter:image',
            content: 'https://subtletools.github.io/move-ts-file/og-image.png',
          },
        },
      ],
    }),
  ],
});