import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightImageZoom from 'starlight-image-zoom';
import starlightLinksValidator from 'starlight-links-validator';
import starlightLLMsTxt from 'starlight-llms-txt';
// import starlightPackageManagers from 'starlight-package-managers';
import starlightTypeDoc from 'starlight-typedoc';
import d2 from 'astro-d2';

// https://astro.build/config
export default defineConfig({
  srcDir: './docs',
  outDir: './dist-docs',
  publicDir: './docs/public',
  site: 'https://move-ts-file.saulo.engineer',
  base: '/',
  integrations: [
    d2(),
    starlight({
      plugins: [
        // Add image zoom functionality
        starlightImageZoom({}),
        // Validate internal links during build
        starlightLinksValidator(),
        // Generate LLMs.txt for AI consumption
        starlightLLMsTxt(),
        // Package manager tabs for installation (temporarily disabled due to compatibility)
        // starlightPackageManagers(),
        // TypeDoc API documentation (temporarily disabled)
        // starlightTypeDoc({
        //   entryPoints: ['../src/index.ts'],
        //   tsconfig: '../tsconfig.json',
        //   typeDoc: {
        //     gitRevision: 'main',
        //   },
        // }),
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
        // {
        //   label: 'API Reference',
        //   autogenerate: { directory: 'api' },
        // },
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