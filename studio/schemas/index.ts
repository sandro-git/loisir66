import { adherentType } from './adherent'
import { brancheType } from './branche'
import { universType } from './univers'
import { territoireType } from './territoire'
import { accueilType } from './accueil'

import type { SchemaPluginOptions } from 'sanity'

export const schema: SchemaPluginOptions = {
  types: [adherentType, brancheType, universType, territoireType, accueilType],
  // « accueil » est un document unique : on ne propose pas d'en créer d'autres.
  templates: (templates) => templates.filter((t) => t.schemaType !== 'accueil'),
}
