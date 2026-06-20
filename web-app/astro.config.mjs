import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { remarkWikiLink } from './src/lib/remark-wikilink.mjs';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  base: '/Dani-s-Backyard',
  integrations: [mdx()],
  markdown: {
    remarkPlugins: [remarkWikiLink],
  },
});