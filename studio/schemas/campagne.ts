import { defineType, defineField, defineArrayMember } from 'sanity'

// Campagne promo / codes CE (cahier des charges §10).
// Les campagnes sont des documents PRIVÉS : leur _id commence par « campagnes. » (un point dans l'identifiant
// rend le document illisible sans jeton, même si le dataset est public). On les crée uniquement via le bouton
// « Nouvelle campagne » du Studio (structure.ts), jamais avec le « + » standard.
// ⚠ Ne pas joindre de fichier confidentiel : les fichiers déposés dans Sanity sont listables publiquement.
//   Utiliser le texte de l'e-mail, le tableau des offres, et au besoin un lien vers un document hébergé ailleurs.

export const campagneType = defineType({
  name: 'campagne',
  title: 'Campagne promo',
  type: 'document',
  groups: [
    { name: 'campagne', title: 'Campagne', default: true },
    { name: 'email', title: 'E-mail envoyé' },
    { name: 'offres', title: 'Offres des adhérents' },
  ],
  fields: [
    defineField({ name: 'nom', title: 'Nom de la campagne', type: 'string', group: 'campagne', validation: (Rule) => Rule.required() }),
    defineField({
      name: 'etat',
      title: 'État',
      type: 'string',
      group: 'campagne',
      options: {
        list: [
          { title: 'Brouillon', value: 'brouillon' },
          { title: 'Active', value: 'active' },
          { title: 'Terminée', value: 'terminee' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'brouillon',
      description: 'Seules les campagnes « Active » (et dans leur période) envoient l’e-mail.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: 'debut', title: 'Début', type: 'date', group: 'campagne' }),
    defineField({
      name: 'fin',
      title: 'Fin',
      type: 'date',
      group: 'campagne',
      validation: (Rule) =>
        Rule.custom((fin, ctx) => {
          const debut = (ctx.document as any)?.debut
          return fin && debut && fin < debut ? 'La fin doit être après le début.' : true
        }),
    }),
    defineField({
      name: 'codes',
      title: 'Codes promo',
      type: 'array',
      group: 'campagne',
      of: [defineArrayMember({ type: 'string', validation: (Rule) => Rule.regex(/^\S+$/, { name: 'sans espace' }).error('Pas d’espace dans un code.') })],
      description: 'Plusieurs codes peuvent mener à la même campagne (ex. GITES2026, CE-AIRBUS). Majuscules / minuscules indifférentes.',
      validation: (Rule) => Rule.required().min(1).unique(),
    }),
    defineField({
      name: 'sujet',
      title: 'Objet de l’e-mail',
      type: 'string',
      group: 'email',
      initialValue: 'Vos offres loisirs dans le 66',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'message',
      title: 'Message',
      type: 'text',
      rows: 8,
      group: 'email',
      description: 'Texte d’introduction de l’e-mail. Le tableau des offres est ajouté automatiquement en dessous.',
    }),
    defineField({
      name: 'lienDocument',
      title: 'Lien vers un document (facultatif)',
      type: 'url',
      group: 'email',
      description: 'Ex : brochure des offres hébergée sur un Drive partagé. Ajouté sous forme de bouton dans l’e-mail.',
    }),
    defineField({
      name: 'offres',
      title: 'Offres par adhérent',
      type: 'array',
      group: 'offres',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'offre',
          fields: [
            defineField({ name: 'adherent', title: 'Adhérent', type: 'reference', to: [{ type: 'adherent' }], validation: (Rule) => Rule.required() }),
            defineField({ name: 'tarifPublic', title: 'Tarif public', type: 'string', description: 'Ex : 15 € / personne' }),
            defineField({ name: 'tarifPromo', title: 'Tarif promotionnel', type: 'string', description: 'Ex : 12 € / personne' }),
            defineField({ name: 'conditions', title: 'Conditions', type: 'text', rows: 3 }),
            defineField({ name: 'debut', title: 'Valable à partir du', type: 'date' }),
            defineField({ name: 'fin', title: 'Valable jusqu’au', type: 'date' }),
          ],
          preview: {
            select: { title: 'adherent.nom', promo: 'tarifPromo', public: 'tarifPublic' },
            prepare: ({ title, promo, public: pub }) => ({ title: title ?? 'Adhérent ?', subtitle: [promo, pub && `au lieu de ${pub}`].filter(Boolean).join(' ') }),
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: 'nom', etat: 'etat', debut: 'debut', fin: 'fin' },
    prepare: ({ title, etat, debut, fin }) => ({
      title,
      subtitle: [{ brouillon: 'Brouillon', active: 'Active', terminee: 'Terminée' }[etat as string] ?? etat, debut && `du ${debut}`, fin && `au ${fin}`].filter(Boolean).join(' · '),
    }),
  },
})
