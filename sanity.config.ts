import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';

export default defineConfig({
  name: 'default',
  title: 'Loisirs 66',

  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID ?? '',
  dataset: import.meta.env.PUBLIC_SANITY_DATASET ?? 'production',

  plugins: [
    structureTool(),
    visionTool(),
  ],

  schema: {
    types: [
      {
        name: 'adherent',
        title: 'Adhérent',
        type: 'document',
        fields: [
          {
            name: 'nom',
            title: 'Nom',
            type: 'string',
            validation: (Rule: any) => Rule.required(),
          },
          {
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: { source: 'nom', maxLength: 96 },
            validation: (Rule: any) => Rule.required(),
          },
          {
            name: 'soustitre',
            title: 'Sous-titre',
            type: 'string',
            description: 'Ex : Salle de réalité virtuelle',
          },
          {
            name: 'type',
            title: 'Type',
            type: 'string',
            options: {
              list: [
                { title: 'Indoor', value: 'Indoor' },
                { title: 'Outdoor', value: 'Outdoor' },
              ],
            },
          },
          {
            name: 'publics',
            title: 'Public(s)',
            type: 'array',
            of: [{ type: 'string' }],
            options: {
              list: [
                { title: 'Famille', value: 'Famille' },
                { title: 'Enfants', value: 'Enfants' },
                { title: 'Adultes', value: 'Adultes' },
                { title: 'Tous publics', value: 'Tous' },
                { title: 'Team building', value: 'Team building' },
              ],
              layout: 'tags',
            },
          },
          {
            name: 'saison',
            title: 'Saison',
            type: 'string',
            options: {
              list: [
                { title: 'Été', value: 'Été' },
                { title: 'Hiver', value: 'Hiver' },
                { title: 'Toute saison', value: 'Toute saison' },
              ],
            },
          },
          {
            name: 'description',
            title: 'Description',
            type: 'text',
            rows: 4,
          },
          {
            name: 'ville',
            title: 'Ville',
            type: 'string',
          },
          {
            name: 'adresse',
            title: 'Adresse',
            type: 'string',
            description: 'Ex : Canet-en-Roussillon, 66140',
          },
          {
            name: 'horaires',
            title: 'Horaires',
            type: 'string',
            description: 'Ex : Mer–Dim, 14h–22h',
          },
          {
            name: 'tarifs',
            title: 'Tarifs',
            type: 'string',
            description: 'Ex : Dès 15€ / séance',
          },
          {
            name: 'siteWeb',
            title: 'Site web',
            type: 'url',
          },
          {
            name: 'image',
            title: 'Image / Logo',
            type: 'image',
            options: { hotspot: true },
          },
        ],
      },
    ],
  },
});
