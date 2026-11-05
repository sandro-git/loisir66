import type { StructureResolver } from 'sanity/structure'
import { NouvelleCampagne } from './NouvelleCampagne'

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
      S.divider(),
      S.listItem()
        .title('Campagnes promo (privé)')
        .id('campagnes')
        .child(
          S.list()
            .title('Campagnes promo')
            .items([
              S.listItem().title('Nouvelle campagne').id('nouvelle-campagne').child(S.component(NouvelleCampagne).title('Nouvelle campagne')),
              S.listItem()
                .title('Toutes les campagnes')
                .id('toutes-campagnes')
                .child(
                  S.documentList()
                    .title('Campagnes')
                    .schemaType('campagne')
                    .filter('_type == "campagne"')
                    .initialValueTemplates([])
                    .defaultOrdering([{ field: '_updatedAt', direction: 'desc' }]),
                ),
            ]),
        ),
    ])
