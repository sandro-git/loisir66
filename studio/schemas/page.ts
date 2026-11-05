import { defineType, defineField, defineArrayMember } from 'sanity'

// Pages de contenu : À propos (avec « Nous rejoindre » et les partenaires) et pages légales.
// Adresses prévues par le pied de page : a-propos, mentions-legales, confidentialite, cookies.
const RESERVES = ['recherche', 'connexion', 'mon-profil', 'admin', 'api', 'loisirs66', 'sitemap.xml', 'robots.txt']

export const pageType = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  fields: [
    defineField({ name: 'titre', title: 'Titre', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({
      name: 'slug',
      title: 'Adresse',
      type: 'slug',
      options: { source: 'titre', maxLength: 64 },
      description: 'Prévues : a-propos, mentions-legales, confidentialite, cookies.',
      validation: (Rule) =>
        Rule.required().custom((v) => (v?.current && RESERVES.includes(v.current) ? 'Adresse réservée par le site.' : true)),
    }),
    defineField({ name: 'introduction', title: 'Introduction', type: 'text', rows: 3 }),
    defineField({
      name: 'contenu',
      title: 'Contenu',
      type: 'array',
      of: [
        defineArrayMember({ type: 'block', styles: [{ title: 'Normal', value: 'normal' }, { title: 'Intertitre', value: 'h2' }, { title: 'Sous-intertitre', value: 'h3' }] }),
      ],
    }),
    defineField({
      name: 'rejoindre',
      title: 'Bloc « Nous rejoindre » (À propos)',
      type: 'text',
      rows: 4,
      description: 'Affiché avec un bouton de contact ; le lien « Nous rejoindre » du pied de page y mène.',
    }),
    defineField({
      name: 'partenaires',
      title: 'Partenaires institutionnels',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'partenaire',
          fields: [
            defineField({ name: 'nom', title: 'Nom', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({ name: 'logo', title: 'Logo officiel', type: 'image' }),
            defineField({ name: 'url', title: 'Site', type: 'url' }),
          ],
          preview: { select: { title: 'nom', media: 'logo' } },
        }),
      ],
    }),
  ],
  preview: { select: { title: 'titre', subtitle: 'slug.current' } },
})
