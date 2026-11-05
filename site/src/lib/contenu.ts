// Requêtes Sanity et logique pure partagées par l'accueil, la recherche et les fiches adhérent.
// Les fonctions pures sont testées dans tests/unit/contenu.test.ts.
// Référentiels de tags : voir aussi studio/schemas/listes.ts (valeurs stockées dans Sanity).

/** Branche « métier » : pour un itinérant, la branche de son activité ; sinon la branche officielle. */
const BRANCHE_EFFECTIVE = `select(itinerant == true && defined(brancheActivite) => brancheActivite, branche)`;
/** Territoires : nouveau champ multiple, sinon l'ancien champ unique. */
const TERRITOIRES = `select(count(territoires) > 0 => territoires, defined(territoire) => [territoire], [])`;
/** Tri sans géolocalisation : ancienneté d'adhésion (plus ancien d'abord), puis nom. */
export const ORDRE_ANCIENNETE = `order(coalesce(dateAdhesion, "9999-12-31") asc, lower(nom) asc)`;

/** Champs nécessaires pour afficher une carte d'activité et la filtrer. */
export const CARTE_FIELDS = `
  _id, nom, "slug": slug.current, soustitre, type, publics, groupes, experiences, cadres, saison, periodes,
  description, activites, ville, image, localisation, itinerant, secteur, dateAdhesion,
  "branche": ${BRANCHE_EFFECTIVE}->{ "slug": slug.current, titre, image },
  "universSecondaire": universSecondaire->slug.current,
  "territoires": ${TERRITOIRES}[]->{ "slug": slug.current, titre }
`;

export const ACCUEIL_QUERY = `{
  "accueil": *[_id == "accueil"][0],
  "univers": *[_type == "univers"] | order(titre asc) {
    titre, "slug": slug.current, image, "branches": branches[]->slug.current
  },
  "territoires": *[_type == "territoire"] | order(titre asc) { titre, "slug": slug.current, image },
  "membres": *[_type == "adherent"] {
    "branche": ${BRANCHE_EFFECTIVE}->{ "slug": slug.current },
    "universSecondaire": universSecondaire->slug.current,
    "territoires": ${TERRITOIRES}[]->{ "slug": slug.current }
  }
}`;

export const FICHE_QUERY = `*[_type == "adherent" && slug.current == $slug][0]{
  ${CARTE_FIELDS},
  surtitre, accroche, galerie, adresse, siteWeb, ctaTitre, ctaTexte,
  "brancheId": ${BRANCHE_EFFECTIVE}._ref,
  "territoireIds": ${TERRITOIRES}[]._ref
}`;

/** « À découvrir aussi » : même branche (métier), classés par ancienneté (le navigateur retrie par distance). */
export const SIMILAIRES_QUERY = `*[_type == "adherent" && _id != $id && ${BRANCHE_EFFECTIVE}._ref == $branche]
  | ${ORDRE_ANCIENNETE}[0...8]{ ${CARTE_FIELDS} }`;

/** « À proximité » : distance depuis le lieu du professionnel consulté (itinérants exclus), sinon mêmes territoires. */
export const PROCHES_GEO_QUERY = `*[_type == "adherent" && _id != $id && itinerant != true && defined(localisation)]
  | order(geo::distance(localisation, $point) asc)[0...8]{ ${CARTE_FIELDS} }`;
export const PROCHES_TERRITOIRE_QUERY = `*[_type == "adherent" && _id != $id && itinerant != true && references($territoires)
  && ${BRANCHE_EFFECTIVE}._ref != $branche] | ${ORDRE_ANCIENNETE}[0...8]{ ${CARTE_FIELDS} }`;

// ——— Référentiels (cahier des charges §6–8, décisions du 05/11/2026)

/** Publics : valeur stockée → libellé affiché. « Tous » et « Team building » sont d'anciennes valeurs. */
export const PUBLICS: Record<string, string> = {
  Famille: 'En famille',
  Enfants: 'Avec des enfants',
  Ados: 'Avec des ados',
  Amis: 'Entre amis',
  Couple: 'En couple',
  Adultes: 'Entre adultes',
  Solo: 'En solo',
  Chiens: 'Chiens bienvenus',
};
const PUBLICS_ANCIENS: Record<string, string> = { Tous: 'Tous publics' };

export function labelPublic(valeur: string): string {
  return PUBLICS[valeur] ?? PUBLICS_ANCIENS[valeur] ?? valeur;
}

/** Publics affichés sur la fiche (« Team building », ancienne valeur, est un groupe). */
export function publicsAffiches(publics?: string[] | null): string[] {
  return (publics ?? []).filter((p) => p !== 'Team building').map(labelPublic);
}

export const GROUPES = [
  'Scolaires', 'Centres de loisirs', 'Colonies de vacances', 'Associations', 'Clubs sportifs',
  'Entreprises & équipes', 'Team building', 'CSE & sorties du personnel', 'Anniversaires', 'EVG & EVJF',
  'Groupes étudiants', 'Groupes seniors', 'Groupes touristiques', 'Groupes privés',
];

/** Groupes accueillis (l'ancienne valeur « Team building » du champ publics compte comme groupe). */
export function groupesEffectifs(a: { groupes?: string[] | null; publics?: string[] | null }): string[] {
  const g = [...(a.groupes ?? [])];
  if ((a.publics ?? []).includes('Team building') && !g.includes('Team building')) g.push('Team building');
  return g;
}

export const EXPERIENCES = ['Sensations', 'Sport', 'Détente', 'Découverte', 'Challenge', 'Rencontre avec les animaux'];

/** Branches considérées « Sensations » tant que le champ Expérience n'est pas rempli. */
export const BRANCHES_SENSATIONS = [
  'sports-mecaniques-66',
  'glisse-66',
  'glisse-montagne-66',
  'parcours-aventure-66',
  'activites-a-corde-et-pleine-nature-66',
  'activites-nautiques-watergames-66',
];
const BRANCHES_ANIMAUX = ['parcs-animaliers-aquariums-66', 'fermes-66', 'balades-equestres-66'];

export function experiencesEffectives(a: { experiences?: string[] | null; branche?: { slug?: string } | null }): string[] {
  if (a.experiences?.length) return a.experiences;
  const b = a.branche?.slug ?? '';
  const deduites: string[] = [];
  if (BRANCHES_SENSATIONS.includes(b)) deduites.push('Sensations');
  if (BRANCHES_ANIMAUX.includes(b)) deduites.push('Rencontre avec les animaux');
  return deduites;
}

export const CADRES = ['En intérieur', 'En plein air', 'Côté terre', 'Côté mer', 'En montagne'];
const CADRE_PAR_TERRITOIRE: Record<string, string> = {
  'cote-rocheuse': 'Côté mer',
  'cote-sableuse': 'Côté mer',
  'arriere-pays': 'Côté terre',
  montagne: 'En montagne',
};

/** Cadre : le champ « cadres », sinon déduit de l'ancien champ type (Indoor/Outdoor) et des territoires. */
export function cadresEffectifs(a: { cadres?: string[] | null; type?: string | null; territoires?: { slug?: string }[] | null }): string[] {
  if (a.cadres?.length) return a.cadres;
  const c = new Set<string>();
  if (a.type === 'Indoor') c.add('En intérieur');
  if (a.type === 'Outdoor') c.add('En plein air');
  for (const t of a.territoires ?? []) if (t?.slug && CADRE_PAR_TERRITOIRE[t.slug]) c.add(CADRE_PAR_TERRITOIRE[t.slug]);
  return CADRES.filter((x) => c.has(x));
}

export const SAISONS = ['Printemps', 'Été', 'Automne', 'Hiver'] as const;
export type Saison = (typeof SAISONS)[number];

/** Saisons d'ouverture : le champ « periodes », sinon déduites de l'ancien champ « saison ». */
export function periodesOuverture(periodes?: string[] | null, saison?: string | null): Saison[] {
  const valides = (periodes ?? []).filter((p): p is Saison => (SAISONS as readonly string[]).includes(p));
  if (valides.length) return SAISONS.filter((s) => valides.includes(s));
  if (saison === 'Toute saison') return [...SAISONS];
  if (saison === 'Été') return ['Été'];
  if (saison === 'Hiver') return ['Hiver'];
  return [];
}

/** Tags de la page d'accueil (bandeau corail) : les 4 prioritaires d'abord (§8), « Ouvert en ce moment » supprimé. */
export const RACCOURCIS: { label: string; params: Record<string, string> }[] = [
  { label: 'Tous', params: {} },
  { label: 'En famille', params: { public: 'famille' } },
  { label: 'Sensations', params: { experience: 'sensations' } },
  { label: 'En intérieur', params: { cadre: 'en intérieur' } },
  { label: 'Groupes & entreprises', params: { groupe: 'tous' } },
  { label: 'Avec des enfants', params: { public: 'enfants' } },
  { label: 'En plein air', params: { cadre: 'en plein air' } },
  { label: 'Aventure', params: { univers: 'sport-aventure' } },
  { label: 'Côté terre', params: { cadre: 'côté terre' } },
  { label: 'Côté mer', params: { cadre: 'côté mer' } },
  { label: 'En montagne', params: { cadre: 'en montagne' } },
  { label: 'Chiens bienvenus', params: { public: 'chiens' } },
];

export function urlRecherche(params: Record<string, string>): string {
  const qs = new URLSearchParams(params).toString();
  return qs ? `/recherche?${qs}` : '/recherche';
}

/** Lieu affiché sous le nom : la ville, ou « Itinérant – secteur » (on n'invente pas de ville). */
export function lieuAffiche(a: { itinerant?: boolean | null; secteur?: string | null; ville?: string | null }): string | null {
  if (a.itinerant) return a.secteur ? `Itinérant – ${a.secteur}` : 'Itinérant';
  return a.ville ? nomLisible(a.ville) : null;
}

/** Tri sans géolocalisation : date d'adhésion croissante (sans date en dernier), puis nom. */
export function trierParAnciennete<T extends { dateAdhesion?: string | null; nom?: string | null }>(xs: T[]): T[] {
  return [...xs].sort((a, b) =>
    (a.dateAdhesion ?? '9999-12-31').localeCompare(b.dateAdhesion ?? '9999-12-31') ||
    (a.nom ?? '').localeCompare(b.nom ?? '', 'fr', { sensitivity: 'base' }),
  );
}

type Membre = { branche?: { slug?: string } | null; universSecondaire?: string | null; territoires?: { slug?: string }[] | null };

/** Un adhérent appartient à un univers par sa branche (univers principal) ou par son univers secondaire. */
export function dansUnivers(a: Membre, univers: { slug: string; branches?: string[] | null }): boolean {
  return (univers.branches ?? []).includes(a.branche?.slug ?? '') || a.universSecondaire === univers.slug;
}

/** Univers et territoires classés par nombre de membres décroissant (puis titre). */
export function classerParMembres<U extends { slug: string; titre: string; branches?: string[] | null }>(
  liste: U[],
  membres: Membre[],
  genre: 'univers' | 'territoire',
): (U & { membres: number })[] {
  return liste
    .map((u) => ({
      ...u,
      membres: membres.filter((m) =>
        genre === 'univers' ? dansUnivers(m, u) : (m.territoires ?? []).some((t) => t?.slug === u.slug),
      ).length,
    }))
    .sort((a, b) => b.membres - a.membres || a.titre.localeCompare(b.titre, 'fr'));
}

/** « À 25 km » / « À moins d'1 km ». */
export function formatDistance(km: number): string {
  if (!Number.isFinite(km)) return '';
  if (km < 1) return 'À moins d’1 km';
  return `À ${Math.round(km)} km`;
}

/** Adresse sur plusieurs lignes (le champ peut contenir des retours à la ligne ou des virgules). */
export function lignesAdresse(adresse?: string | null): string[] {
  if (!adresse) return [];
  const lignes = adresse.includes('\n') ? adresse.split('\n') : adresse.split(/,\s*/);
  return lignes.map((l) => l.trim()).filter(Boolean);
}

/** Lien Google Maps vers l'adresse ou la position. */
export function urlItineraire(opts: { adresse?: string | null; ville?: string | null; lat?: number; lng?: number }): string | null {
  if (opts.lat != null && opts.lng != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${opts.lat},${opts.lng}`;
  }
  const dest = [opts.adresse?.replace(/\n/g, ', '), opts.ville].filter(Boolean).join(', ');
  return dest ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}` : null;
}

const MOTS_OUTILS = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'et', 'aux', 'au', 'à', 'en', 'sur', 'd', 'l']);

/**
 * Nom saisi tout en capitales → casse lisible (« PARC ANIMALIER DE CASTEIL » → « Parc Animalier de Casteil »).
 * Un nom déjà en casse mixte (« VR Café », « EcoZonia ») est conservé tel quel.
 */
export function nomLisible(nom: string): string {
  if (!nom) return nom;
  const lettres = nom.replace(/[^\p{L}]/gu, '');
  const majuscules = lettres.replace(/[^\p{Lu}]/gu, '');
  if (lettres.length === 0 || majuscules.length / lettres.length < 0.8) return nom;
  let premier = true;
  return nom
    .toLocaleLowerCase('fr')
    .replace(/\p{L}+/gu, (mot) => {
      const garder = !premier && MOTS_OUTILS.has(mot);
      premier = false;
      return garder ? mot : mot.charAt(0).toLocaleUpperCase('fr') + mot.slice(1);
    });
}

export type CritereRecherche = {
  q?: string;
  univers?: string;
  territoire?: string;
  public?: string;
  cadre?: string;
  groupe?: string;
  experience?: string;
  saison?: string;
};

export const CRITERES: (keyof CritereRecherche)[] = ['q', 'univers', 'territoire', 'public', 'cadre', 'groupe', 'experience', 'saison'];

/** Lit les critères depuis l'URL (valeurs vides ignorées ; anciens paramètres type= et ambiance= convertis). */
export function lireCriteres(params: URLSearchParams): CritereRecherche {
  const c: CritereRecherche = {};
  for (const k of CRITERES) {
    const v = params.get(k)?.trim();
    if (v) c[k] = v;
  }
  const type = params.get('type')?.trim().toLowerCase();
  if (!c.cadre && type === 'indoor') c.cadre = 'en intérieur';
  if (!c.cadre && type === 'outdoor') c.cadre = 'en plein air';
  const ambiance = params.get('ambiance')?.trim();
  if (!c.experience && ambiance) c.experience = ambiance;
  return c;
}

export const sansAccents = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
const egal = (a?: string | null, b?: string) => sansAccents(a ?? '') === sansAccents(b ?? '');


/** Texte sur lequel porte la recherche par mots-clés. */
export function texteRecherche(a: Record<string, any>): string {
  return sansAccents(
    [
      a.nom, a.soustitre, a.description, a.ville, a.secteur, a.branche?.titre,
      ...(a.activites ?? []), ...publicsAffiches(a.publics), ...groupesEffectifs(a),
      ...experiencesEffectives(a), ...cadresEffectifs(a), ...(a.territoires ?? []).map((t: any) => t?.titre),
    ].filter(Boolean).join(' '),
  );
}

/**
 * Synonymes de recherche (cahier des charges §8) : expression saisie → libellés de tags équivalents.
 * Référentiel à enrichir au fil des retours ; comparaisons sans accents ni casse.
 */
export const SYNONYMES: [string[], string[]][] = [
  [['chien', 'chiens', 'chien accepte', 'chiens acceptes', 'activite avec chien', 'dog friendly', 'dog'], ['chiens bienvenus']],
  [['seminaire', 'seminaires', 'comite d entreprise', 'comite d\'entreprise', 'ce', 'cse', 'entreprise', 'entreprises', 'sortie du personnel'], ['entreprises & equipes', 'cse & sorties du personnel', 'team building']],
  [['cohesion d equipe', 'cohesion d\'equipe', 'cohesion', 'teambuilding', 'team building'], ['team building']],
  [['bde', 'integration etudiante', 'sortie etudiante', 'etudiant', 'etudiants', 'etudiante', 'etudiantes'], ['groupes etudiants']],
  [['evg', 'evjf', 'enterrement de vie de garcon', 'enterrement de vie de jeune fille', 'enterrement de vie'], ['evg & evjf']],
  [['anniversaire', 'anniversaires', 'anniv'], ['anniversaires']],
  [['ecole', 'scolaire', 'classe', 'sortie scolaire'], ['scolaires']],
  [['ados', 'ado', 'adolescent', 'adolescents'], ['avec des ados']],
  [['indoor', 'interieur', 'couvert', 'quand il pleut', 'pluie'], ['en interieur']],
  [['outdoor', 'exterieur', 'plein air'], ['en plein air']],
  [['mer', 'plage', 'bord de mer'], ['cote mer']],
  [['montagne', 'pyrenees'], ['en montagne']],
  [['spa', 'thalasso', 'bain', 'bains', 'detente', 'relaxation'], ['detente', 'thermoludisme', 'bien-etre']],
];

/**
 * Découpe une recherche en termes ; chaque terme est une liste de variantes dont une seule doit apparaître.
 * Les expressions synonymes (même en plusieurs mots) sont reconnues en premier.
 */
export function analyserRecherche(q: string): string[][] {
  let reste = ` ${sansAccents(q).replace(/[’']/g, "'").replace(/\s+/g, ' ').trim()} `;
  const termes: string[][] = [];
  const expressions = SYNONYMES.flatMap(([formes, cibles]) => formes.map((f) => [sansAccents(f), cibles] as const))
    .sort((a, b) => b[0].length - a[0].length);
  for (const [forme, cibles] of expressions) {
    const motif = ` ${forme} `;
    if (reste.includes(motif)) {
      termes.push([forme, ...cibles]);
      reste = reste.split(motif).join(' ');
    }
  }
  for (const mot of reste.split(' ').filter(Boolean)) termes.push([mot]);
  return termes;
}

/** Saison en cours (pour les suggestions automatiques « À faire cet automne »). */
export function saisonCourante(d = new Date()): Saison {
  const m = Number(new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Paris', month: 'numeric' }).format(d));
  if (m >= 3 && m <= 5) return 'Printemps';
  if (m >= 6 && m <= 8) return 'Été';
  if (m >= 9 && m <= 11) return 'Automne';
  return 'Hiver';
}

export function libelleSaison(s: Saison): string {
  return { Printemps: 'À faire au printemps', 'Été': 'À faire cet été', Automne: 'À faire cet automne', Hiver: 'À faire cet hiver' }[s];
}

/** Tags du bandeau : « Tous », puis la suggestion saisonnière du moment, puis les tags fixes. */
export function tagsAccueil(d = new Date()): { label: string; params: Record<string, string> }[] {
  const saison = saisonCourante(d);
  const [tous, ...autres] = RACCOURCIS;
  return [tous, { label: libelleSaison(saison), params: { saison: saison.toLowerCase() } }, ...autres];
}

/** Filtre les activités selon les critères de /recherche. */
export function filtrerActivites<T extends Record<string, any>>(
  activites: T[],
  c: CritereRecherche,
  univers: { slug: string; branches?: string[] | null }[] = [],
): T[] {
  const termes = c.q ? analyserRecherche(c.q) : [];
  const u = c.univers ? univers.find((x) => x.slug === c.univers) : undefined;
  return activites.filter((a) => {
    if (termes.length) {
      const texte = texteRecherche(a);
      if (!termes.every((variantes) => variantes.some((v) => texte.includes(v)))) return false;
    }
    if (c.univers && (!u || !dansUnivers(a, u))) return false;
    if (c.territoire && !(a.territoires ?? []).some((t: any) => t?.slug === c.territoire)) return false;
    if (c.cadre && !cadresEffectifs(a).some((x) => egal(x, c.cadre))) return false;
    if (c.public && !(a.publics ?? []).some((p: string) => egal(p, c.public))) return false;
    if (c.groupe) {
      const g = groupesEffectifs(a);
      if (c.groupe === 'tous' ? g.length === 0 : !g.some((x) => egal(x, c.groupe))) return false;
    }
    if (c.experience && !experiencesEffectives(a).some((x) => egal(x, c.experience))) return false;
    if (c.saison && !periodesOuverture(a.periodes, a.saison).some((x) => egal(x, c.saison))) return false;
    return true;
  });
}

/** URL de /recherche avec un critère ajouté, remplacé ou retiré (s'il était déjà actif avec cette valeur). */
export function basculerCritere(c: CritereRecherche, cle: keyof CritereRecherche, valeur: string): string {
  const suivant: Record<string, string> = {};
  for (const [k, v] of Object.entries(c)) if (v) suivant[k] = v;
  if (suivant[cle] !== undefined && egal(suivant[cle], valeur)) delete suivant[cle];
  else suivant[cle] = valeur;
  return urlRecherche(suivant);
}

/** Photo à afficher : celle de l'adhérent, sinon celle de sa branche (toutes les branches en ont une). */
export function photoPrincipale(a: { image?: any; branche?: { image?: any } | null }): any | null {
  if (a.image?.asset) return a.image;
  if (a.branche?.image?.asset) return a.branche.image;
  return null;
}
