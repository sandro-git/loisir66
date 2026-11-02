// @ts-nocheck
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import netlify from '@astrojs/netlify';

// https://astro.build/docs
export default defineConfig({
  integrations: [
    react(),
  ],

  vite: {
    plugins: [tailwindcss()],
    build: {
      chunkSizeWarningLimit: 8000,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('VideoPlayer') || id.includes('video-player')) {
              return 'video-player';
            }
          }
        }
      }
    }
  },
  image: {
    domains: ['cdn.sanity.io', 'images.unsplash.com'],
  },
  output: 'server',
  adapter: netlify({
    edgeMiddleware: true,
    imageCDN: false
  })
});
