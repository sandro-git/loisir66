import { adherentType } from './adherent'
import { brancheType } from './branche'
import { universType } from './univers'
import { territoireType } from './territoire'
import { accueilType } from './accueil'
import { campagneType } from './campagne'

import type { SchemaPluginOptions } from 'sanity'

export const schema: SchemaPluginOptions = {
  types: [adherentType, brancheType, universType, territoireType, accueilType, campagneType],
  // « accueil » est un document unique ; « campagne » se crée via « Nouvelle campagne » (identifiant privé).
  templates: (templates) => templates.filter((t) => t.schemaType !== 'accueil' && t.schemaType !== 'campagne'),
}
