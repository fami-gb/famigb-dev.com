import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import { katexPlugin, codeFrame, nierTheme } from './markdown.mjs';

export default defineConfig({
  site: 'https://famigb-dev.com',
  markdown: {
    shikiConfig: { theme: nierTheme, transformers: [codeFrame] },
    processor: satteri({ features: { math: true }, hastPlugins: [katexPlugin] }),
  },
});
