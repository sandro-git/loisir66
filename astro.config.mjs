// @ts-check
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
      useCdn: false,
      apiVersion: process.env.PUBLIC_SANITY_API_VERSION ?? '2024-01-01',
      studioBasePath: '/studio',
    }),
    react(),
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  output: 'server',
  adapter: netlify(),
});
