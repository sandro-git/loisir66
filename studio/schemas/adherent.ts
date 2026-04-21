import { defineType, defineField } from 'sanity'

export const adherentType = defineType({
  name: 'adherent',
  title: 'Adhérent',
  type: 'document',
  fields: [
    defineField({
      name: 'nom',
      title: 'Nom',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'nom', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'soustitre',
      title: 'Sous-titre',
      type: 'string',
      description: 'Ex : Salle de réalité virtuelle',
    }),
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          { title: 'Indoor', value: 'Indoor' },
          { title: 'Outdoor', value: 'Outdoor' },
        ],
      },
    }),
    defineField({
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
    }),
    defineField({
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
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'ville',
      title: 'Ville',
      type: 'string',
    }),
    defineField({
      name: 'adresse',
      title: 'Adresse',
      type: 'string',
      description: 'Ex : Canet-en-Roussillon, 66140',
    }),
    defineField({
      name: 'horaires',
      title: 'Horaires',
      type: 'string',
      description: 'Ex : Mer–Dim, 14h–22h',
    }),
    defineField({
      name: 'tarifs',
      title: 'Tarifs',
      type: 'string',
      description: 'Ex : Dès 15€ / séance',
    }),
    defineField({
      name: 'siteWeb',
      title: 'Site web',
      type: 'url',
    }),
    defineField({
      name: 'image',
      title: 'Image / Logo',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'branche',
      title: 'Branche',
      type: 'reference',
      to: [{ type: 'branche' }],
    }),
  ],
})
