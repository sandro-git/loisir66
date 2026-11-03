import type { StructureResolver } from 'sanity/structure'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Contenu')
    .items([
      S.listItem()
        .title('Page d’accueil & coordonnées')
        .id('accueil')
        .child(S.document().schemaType('accueil').documentId('accueil')),
      S.divider(),
      S.documentTypeListItem('adherent').title('Adhérents'),
      S.documentTypeListItem('univers').title('Univers (accueil)'),
      S.documentTypeListItem('territoire').title('Territoires'),
      S.documentTypeListItem('branche').title('Branches'),
    ])
