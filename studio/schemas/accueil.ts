import { defineType, defineField, defineArrayMember } from 'sanity'

// Document unique (id « accueil ») : contenus et liens de la page d'accueil et du pied de page.
export const accueilType = defineType({
  name: 'accueil',
  title: 'Page d’accueil & coordonnées',
  type: 'document',
  groups: [
    { name: 'hero', title: 'Bandeau', default: true },
    { name: 'instagram', title: 'Instagram' },
    { name: 'contact', title: 'Coordonnées & réseaux' },
  ],
  fields: [
    defineField({
      name: 'heroTitre',
      title: 'Titre',
      type: 'string',
      group: 'hero',
      initialValue: 'Découvrez les loisirs du 66,',
    }),
    defineField({
      name: 'heroSousTitre',
      title: 'Sous-titre',
      type: 'string',
      group: 'hero',
      initialValue: 'directement auprès des professionnels d’ici.',
    }),
    defineField({
      name: 'slides',
      title: 'Photos du bandeau',
      type: 'array',
      group: 'hero',
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [defineField({ name: 'alt', title: 'Texte alternatif', type: 'string' })],
        }),
      ],
      options: { layout: 'grid' },
    }),
    defineField({
      name: 'instagramPhotos',
      title: 'Photos « Vos loisirs sur Instagram »',
      type: 'array',
      group: 'instagram',
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({ name: 'alt', title: 'Texte alternatif', type: 'string' }),
            defineField({ name: 'lien', title: 'Lien vers la publication', type: 'url' }),
          ],
        }),
      ],
      options: { layout: 'grid' },
    }),
    defineField({ name: 'instagram', title: 'Compte Instagram (URL)', type: 'url', group: 'contact' }),
    defineField({ name: 'facebook', title: 'Page Facebook (URL)', type: 'url', group: 'contact' }),
    defineField({ name: 'linkedin', title: 'Page LinkedIn (URL)', type: 'url', group: 'contact' }),
    defineField({ name: 'email', title: 'E-mail de contact', type: 'string', group: 'contact' }),
    defineField({ name: 'telephone', title: 'Téléphone', type: 'string', group: 'contact' }),
  ],
  preview: { prepare: () => ({ title: 'Page d’accueil & coordonnées' }) },
})
