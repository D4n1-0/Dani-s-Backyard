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
                    if (req.url && (req.url.startsWith('/pagefind/') || req.url.startsWith('/Dani-s-Backyard/pagefind/'))) {
                      const urlPath = req.url.split('?')[0]; 
                      const cleanPath = urlPath.startsWith('/Dani-s-Backyard/pagefind/')
                        ? urlPath.replace('/Dani-s-Backyard/pagefind/', '')
                        : urlPath.replace('/pagefind/', '');
                      const fileName = decodeURIComponent(cleanPath);

                      let filePath = path.resolve(process.cwd(), 'public/pagefind', fileName);
                      if (!fs.existsSync(filePath)) {
                        filePath = path.resolve(process.cwd(), 'dist/pagefind', fileName);
                      }

                      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                        const ext = path.extname(filePath).toLowerCase();
                        const mimes = {
                          '.js': 'application/javascript',
                          '.json': 'application/json',
                          '.css': 'text/css',
                          '.pf_meta': 'application/octet-stream',
                          '.pf_index': 'application/octet-stream',
                          '.pf_fragment': 'application/octet-stream',
                        };
                        res.setHeader('Content-Type', mimes[ext] || 'application/octet-stream');
                        return fs.createReadStream(filePath).pipe(res);
                      }
                    }
                    if (req.url && (req.url.startsWith('/_attachments/') || req.url.startsWith('/Dani-s-Backyard/_attachments/'))) {
                      const urlPath = req.url.split('?')[0]; 
                      const cleanPath = urlPath.startsWith('/Dani-s-Backyard/_attachments/')
                        ? urlPath.replace('/Dani-s-Backyard/_attachments/', '')
                        : urlPath.replace('/_attachments/', '');
                      const fileName = decodeURIComponent(cleanPath);
                      
                      let filePath = path.resolve(process.cwd(), '../synced-attachments', fileName);
                      if (!fs.existsSync(filePath)) {
                        filePath = path.resolve(process.cwd(), 'public/_attachments', fileName);
                      }
                      if (!fs.existsSync(filePath)) {
                        filePath = path.resolve(process.cwd(), '../The Stories/_attachments', fileName);
                      }
                      
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
        const dest = path.join(outDir, '_attachments');
        
        const srcSynced = path.resolve(process.cwd(), '../synced-attachments');
        const srcVault = path.resolve(process.cwd(), '../The Stories/_attachments');
        
        if (fs.existsSync(srcSynced)) {
          fs.cpSync(srcSynced, dest, { recursive: true });
        } else if (fs.existsSync(srcVault)) {
          fs.cpSync(srcVault, dest, { recursive: true });
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