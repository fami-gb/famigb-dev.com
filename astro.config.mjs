import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import { katexPlugin, mermaidPlugin, githubCard, alertPlugin, codeFrame, nierTheme } from './markdown.mjs';

export default defineConfig({
  site: 'https://famigb-dev.com',
  markdown: {
    syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid'] },
    shikiConfig: { theme: nierTheme, transformers: [codeFrame] },
    processor: satteri({ features: { math: true }, hastPlugins: [katexPlugin, mermaidPlugin, githubCard, alertPlugin] }),
  },
});
