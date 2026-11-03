import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schema } from './schemas'
import { structure } from './structure'

export default defineConfig({
  name: 'loisirs66',
  title: 'Loisirs 66',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? '',
  dataset: process.env.SANITY_STUDIO_DATASET ?? 'production',
  plugins: [structureTool({ structure }), visionTool()],
  document: {
    // pas de duplication / suppression du document unique « accueil »
    actions: (prev, { schemaType }) =>
      schemaType === 'accueil' ? prev.filter(({ action }) => action !== 'duplicate' && action !== 'delete') : prev,
  },
  schema,
})
