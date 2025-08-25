import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightImageZoom from 'starlight-image-zoom';
import starlightLinksValidator from 'starlight-links-validator';

// https://astro.build/config
export default defineConfig({
  srcDir: './docs',
  outDir: './dist-docs',
  publicDir: './docs/public',
  site: 'https://move-ts-file.saulo.engineer',
  base: '/',
  integrations: [
    starlight({
      plugins: [
        // Add image zoom functionality
        starlightImageZoom({}),
        // Validate internal links during build
        starlightLinksValidator(),
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
            { label: 'Barrel Exports', link: '/features/barrel-exports/' },
          ],
        },
        {
          label: 'AI Integration',
          items: [
            { label: 'AI-Assisted Refactoring', link: '/claude/refactoring/' },
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
            content: 'https://move-ts-file.saulo.engineer/og-image.png',
          },
        },
        {
          tag: 'meta',
          attrs: {
            name: 'twitter:image',
            content: 'https://move-ts-file.saulo.engineer/og-image.png',
          },
        },
      ],
    }),
  ],
});