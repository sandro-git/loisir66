import { defineType, defineField, defineArrayMember } from 'sanity'

// Les « univers » de la page d'accueil regroupent une ou plusieurs branches.
export const universType = defineType({
  name: 'univers',
  title: 'Univers (accueil)',
  type: 'document',
  fields: [
    defineField({ name: 'titre', title: 'Titre', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'titre', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: 'image', title: 'Image', type: 'image', options: { hotspot: true } }),
    defineField({
      name: 'branches',
      title: 'Branches incluses',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'branche' }] })],
    }),
    defineField({ name: 'ordre', title: 'Ordre d’affichage', type: 'number' }),
  ],
  orderings: [{ title: 'Ordre', name: 'ordre', by: [{ field: 'ordre', direction: 'asc' }] }],
  preview: { select: { title: 'titre', media: 'image' } },
})
