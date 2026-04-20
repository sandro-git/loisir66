// @ts-nocheck
import { defineConfig } from 'astro/config';

import sanity from '@sanity/astro';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import netlify from '@astrojs/netlify';

const sanityProjectId = process.env.PUBLIC_SANITY_PROJECT_ID;

// https://astro.build/docs
export default defineConfig({
  integrations: [
    // Sanity est toujours chargé pour enregistrer le module virtuel "sanity:studio".
    // Sans ça, la page /studio crashe au build même si le projectId est vide.
    sanity({
      projectId: sanityProjectId || 'placeholder',
      dataset: process.env.PUBLIC_SANITY_DATASET ?? 'production',
      useCdn: true,
      apiVersion: process.env.PUBLIC_SANITY_API_VERSION ?? '2024-01-01',
      studioBasePath: '/studio',
    }),
    react(),
  ],

  vite: {
    plugins: [tailwindcss()],
    build: {
      chunkSizeWarningLimit: 8000,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Tout Sanity dans un seul chunk pour éviter les dépendances circulaires
            if (id.includes('@sanity/') || id.includes('sanity/lib') || id.includes('studio-component')) {
              return 'sanity';
            }
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
    imageCDN: false  // Désactive l'optimisation d'images Netlify en dev
  })
});
