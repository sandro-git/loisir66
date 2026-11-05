// Référentiels de tags du cahier des charges APLPO (03/11/2026, décisions du 05/11/2026).
// Les valeurs (`value`) sont stockées dans Sanity : ne pas les renommer sans migrer les données.
// Gardées en phase avec site/src/lib/contenu.ts.

export const PUBLICS = [
  { title: 'En famille', value: 'Famille' },
  { title: 'Avec des enfants', value: 'Enfants' },
  { title: 'Avec des ados', value: 'Ados' },
  { title: 'Entre amis', value: 'Amis' },
  { title: 'En couple', value: 'Couple' },
  { title: 'Entre adultes', value: 'Adultes' },
  { title: 'En solo', value: 'Solo' },
  { title: 'Chiens bienvenus (le chien participe à l’activité)', value: 'Chiens' },
]

export const GROUPES = [
  'Scolaires',
  'Centres de loisirs',
  'Colonies de vacances',
  'Associations',
  'Clubs sportifs',
  'Entreprises & équipes',
  'Team building',
  'CSE & sorties du personnel',
  'Anniversaires',
  'EVG & EVJF',
  'Groupes étudiants',
  'Groupes seniors',
  'Groupes touristiques',
  'Groupes privés',
].map((v) => ({ title: v, value: v }))

export const EXPERIENCES = ['Sensations', 'Sport', 'Détente', 'Découverte', 'Challenge', 'Rencontre avec les animaux'].map((v) => ({ title: v, value: v }))

export const CADRES = ['En intérieur', 'En plein air', 'Côté terre', 'Côté mer', 'En montagne'].map((v) => ({ title: v, value: v }))

export const SAISONS = ['Printemps', 'Été', 'Automne', 'Hiver'].map((v) => ({ title: v, value: v }))
