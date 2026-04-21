import { createClient } from '@sanity/client';

// Client serveur uniquement — token write jamais exposé au navigateur
export const sanityWriter = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
  dataset: import.meta.env.PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: import.meta.env.PUBLIC_SANITY_API_VERSION ?? '2024-01-01',
  useCdn: false,
  token: import.meta.env.SANITY_WRITE_TOKEN,
});
