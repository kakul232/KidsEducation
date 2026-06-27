import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { promises as fs } from 'fs'
import path from 'path'

const generateLocalGamesJson = async () => {
  const gamesDir = path.resolve(process.cwd(), 'src', 'game');
  const publicDir = path.resolve(process.cwd(), 'public');
  try {
    await fs.mkdir(publicDir, { recursive: true });
    await fs.mkdir(gamesDir, { recursive: true });
    
    const files = await fs.readdir(gamesDir);
    const htmlFiles = files.filter(f => f.endsWith('.html'));
    
    const games = [];
    for (const file of htmlFiles) {
      const content = await fs.readFile(path.join(gamesDir, file), 'utf-8');
      
      const titleMatch = content.match(/<title>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : file.replace('.html', '');
      
      const isHopper = file.toLowerCase().includes('frog') || file.toLowerCase().includes('hopper');
      const topic = isHopper ? 'Counting' : 'Arithmetic';
      const difficulty = isHopper ? 'Easy' : 'Medium';
      
      games.push({
        id: file.replace('.html', ''),
        title: title,
        topic: topic,
        subject: 'Mathematics',
        age: 5,
        difficulty: difficulty,
        htmlContent: content,
        published: true,
        createdAt: new Date().toISOString()
      });
    }
    
    await fs.writeFile(path.join(publicDir, 'local-games.json'), JSON.stringify(games, null, 2), 'utf-8');
    console.log(`[Vite] Generated local-games.json containing ${games.length} games.`);
  } catch (e) {
    console.error('[Vite] Failed to generate local-games.json', e);
  }
};

const saveGamePlugin = () => ({
  name: 'save-game-endpoint',
  async buildStart() {
    await generateLocalGamesJson();
  },
  configureServer(server: any) {
    // Generate initially when dev server starts
    generateLocalGamesJson();

    server.middlewares.use(async (req: any, res: any, next: any) => {
      if (req.url === '/api/save-game' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk;
        });
        req.on('end', async () => {
          try {
            const data = JSON.parse(body);
            const { title, htmlContent } = data;
            if (!title || !htmlContent) {
              res.statusCode = 400;
              res.end('Missing title or htmlContent');
              return;
            }
            const filename = title
              .replace(/[^a-zA-Z0-9]/g, '-')
              .toLowerCase()
              .replace(/-+/g, '-')
              .replace(/^-|-$/g, '') + '.html';
              
            const filepath = path.resolve(process.cwd(), 'src', 'game', filename);
            
            await fs.mkdir(path.dirname(filepath), { recursive: true });
            await fs.writeFile(filepath, htmlContent, 'utf-8');
            console.log(`[Vite Server] Game saved to: ${filepath}`);
            
            // Re-generate database json
            await generateLocalGamesJson();

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, filename }));
          } catch (err: any) {
            console.error('[Vite Server] Save game error:', err);
            res.statusCode = 500;
            res.end(err.message || 'Server error');
          }
        });
      } else {
        next();
      }
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    saveGamePlugin(),
    VitePWA({
      injectRegister: 'inline',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Educational Play Studio',
        short_name: 'PlayStudio',
        description: 'Interactive educational games for dyslexic children',
        theme_color: '#4f46e5',
        background_color: '#f4f7f6',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,json}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          },
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'jsdelivr-cdn-assets',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 180 // 6 months
              }
            }
          }
        ]
      }
    })
  ]
})
