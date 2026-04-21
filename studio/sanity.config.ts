import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { adherentType } from './schemas/adherent'

export default defineConfig({
  name: 'loisirs66',
  title: 'Loisirs 66',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? '',
  dataset: process.env.SANITY_STUDIO_DATASET ?? 'production',
  plugins: [structureTool(), visionTool()],
  schema: { types: [adherentType] },
})
