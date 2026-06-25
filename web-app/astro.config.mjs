import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { remarkWikiLink } from './src/lib/remark-wikilink.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

function vaultAttachmentsIntegration() {
  return {
    name: 'vault-attachments',
    hooks: {
      'astro:config:setup': ({ updateConfig }) => {
        updateConfig({
          vite: {
            plugins: [
              {
                name: 'serve-vault-attachments',
                configureServer(server) {
                  server.middlewares.use((req, res, next) => {
                    const basePath = '/Dani-s-Backyard/_attachments/';
                    if (req.url && req.url.startsWith(basePath)) {
                      const urlPath = req.url.split('?')[0]; 
                      const fileName = decodeURIComponent(urlPath.replace(basePath, ''));
                      const filePath = path.resolve(process.cwd(), '../The Stories/_attachments', fileName);
                      
                      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                        const ext = path.extname(filePath).toLowerCase();
                        const mimes = {
                          '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', 
                          '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml'
                        };
                        res.setHeader('Content-Type', mimes[ext] || 'application/octet-stream');
                        return fs.createReadStream(filePath).pipe(res);
                      }
                    }
                    next();
                  });
                }
              }
            ]
          }
        });
      },
      'astro:build:done': async ({ dir }) => {
        const outDir = fileURLToPath(dir);
        const src = path.resolve(process.cwd(), '../The Stories/_attachments');
        const dest = path.join(outDir, '_attachments');
        if (fs.existsSync(src)) {
          fs.cpSync(src, dest, { recursive: true });
        }
      }
    }
  };
}

// https://astro.build/config
export default defineConfig({
  output: 'static',
  base: '/Dani-s-Backyard',
  integrations: [mdx(), vaultAttachmentsIntegration()],
  markdown: {
    remarkPlugins: [remarkWikiLink],
  },
});