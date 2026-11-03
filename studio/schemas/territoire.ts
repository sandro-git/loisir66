import { defineType, defineField } from 'sanity'

export const territoireType = defineType({
  name: 'territoire',
  title: 'Territoire',
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
    defineField({ name: 'ordre', title: 'Ordre d’affichage', type: 'number' }),
  ],
  orderings: [{ title: 'Ordre', name: 'ordre', by: [{ field: 'ordre', direction: 'asc' }] }],
  preview: { select: { title: 'titre', media: 'image' } },
})
