import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightImageZoom from 'starlight-image-zoom';
import starlightLinksValidator from 'starlight-links-validator';
import starlightLLMsTxt from 'starlight-llms-txt';
// import starlightPackageManagers from 'starlight-package-managers';
import starlightTypeDoc from 'starlight-typedoc';
import starlightSidebarTopics from 'starlight-sidebar-topics';
import d2 from 'astro-d2';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
        // Organize sidebar with topics
        starlightSidebarTopics([
          {
            label: 'Documentation',
            link: '/introduction/',
            icon: 'document',
            items: [
              {
                label: 'Getting Started',
                items: [
                  { label: 'Introduction', link: '/introduction/' },
                  { label: 'Installation', link: '/installation/' },
                  { label: 'Quick Start', link: '/quick-start/' }
                ]
              },
              {
                label: 'Features',
                items: [
                  { label: 'Import Styles', link: '/features/import-styles/' },
                  { label: 'Barrel Exports', link: '/features/barrel-exports/' }
                ]
              },
              {
                label: 'AI Integration',
                items: [
                  { label: 'Claude Code Refactoring', link: '/claude/refactoring/' },
                  { label: 'llms.txt', link: '/llms.txt' }
                ]
              },
              {
                label: 'Reference',
                items: [
                  { label: 'CLI Reference', link: '/cli-reference/' },
                  { label: 'Troubleshooting', link: '/troubleshooting/' }
                ]
              },
            ],
          },
          {
            label: 'API Reference',
            link: '/api/readme/',
            icon: 'seti:config',
            items: [
              { label: 'API Overview', link: '/api/readme/' },
              {
                label: 'Core Classes',
                items: [
                  { label: 'TypeScriptFileMover', link: '/api/classes/typescriptfilemover/' },
                  { label: 'BarrelAnalyzer', link: '/api/classes/barrelanalyzer/' },
                  { label: 'ImportAnalyzer', link: '/api/classes/importanalyzer/' }
                ]
              },
              {
                label: 'Path Resolvers',
                items: [
                  { label: 'PathResolver', link: '/api/classes/pathresolver/' },
                  { label: 'TsConfigPathResolver', link: '/api/classes/tsconfigpathresolver/' },
                  { label: 'RelativePathResolver', link: '/api/classes/relativepathresolver/' },
                  { label: 'PackageImportsResolver', link: '/api/classes/packageimportsresolver/' }
                ]
              },
              {
                label: 'Configuration',
                items: [
                  { label: 'ConfigLoader', link: '/api/classes/configloader/' }
                ]
              },
              {
                label: 'Interfaces',
                items: [
                  { label: 'TypeScriptFileMoverOptions', link: '/api/interfaces/typescriptfilemoveroptions/' },
                  { label: 'ImportReference', link: '/api/interfaces/importreference/' },
                  { label: 'BarrelAnalysisResult', link: '/api/interfaces/barrelanalysisresult/' },
                  { label: 'FileUpdate', link: '/api/interfaces/fileupdate/' },
                  { label: 'BarrelExport', link: '/api/interfaces/barrelexport/' },
                  { label: 'ImportTypeInfo', link: '/api/interfaces/importtypeinfo/' },
                  { label: 'NamedExport', link: '/api/interfaces/namedexport/' },
                  { label: 'PackageImportsInfo', link: '/api/interfaces/packageimportsinfo/' },
                  { label: 'PathMappingInfo', link: '/api/interfaces/pathmappinginfo/' }
                ]
              }
            ],
          },
        ]),
        // Package manager tabs for installation (temporarily disabled due to compatibility)
        // starlightPackageManagers(),
        // TypeDoc API documentation
        starlightTypeDoc({
          entryPoints: [resolve(__dirname, 'src/index.ts')],
          tsconfig: resolve(__dirname, 'tsconfig.json'),
          output: 'api',
          typeDoc: {
            gitRevision: 'main',
          },
        }),
      ],
      title: 'move-ts-file',
      description: 'Intelligent CLI tool to move TypeScript files and automatically update all import paths throughout your project',
      expressiveCode: {
        themes: ['tokyo-night'],
      },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/SubtleTools/move-ts-file',
        },
      ],
      // Sidebar configuration handled by starlight-sidebar-topics plugin
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
