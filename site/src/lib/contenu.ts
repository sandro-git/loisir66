// Requêtes Sanity et logique pure partagées par l'accueil, la recherche et les fiches adhérent.
// Les fonctions pures sont testées dans tests/unit/contenu.test.ts.

/** Champs nécessaires pour afficher une carte d'activité. */
export const CARTE_FIELDS = `
  _id, nom, "slug": slug.current, soustitre, type, publics, groupes, saison, periodes,
  description, ville, image, localisation,
  "branche": branche->{ "slug": slug.current, titre, image },
  "territoire": territoire->{ "slug": slug.current, titre }
`;

export const ACCUEIL_QUERY = `{
  "accueil": *[_id == "accueil"][0],
  "univers": *[_type == "univers"] | order(ordre asc, titre asc) {
    titre, "slug": slug.current, image, "branches": branches[]->slug.current
  },
  "territoires": *[_type == "territoire"] | order(ordre asc, titre asc) {
    titre, "slug": slug.current, image
  }
}`;

export const FICHE_QUERY = `*[_type == "adherent" && slug.current == $slug][0]{
  ${CARTE_FIELDS},
  surtitre, accroche, activites, galerie, adresse, horaires, tarifs, siteWeb, ctaTitre, ctaTexte,
  "brancheId": branche._ref, "territoireId": territoire._ref
}`;

/** Même branche (« À découvrir aussi »). */
export const SIMILAIRES_QUERY = `*[_type == "adherent" && branche._ref == $branche && _id != $id] | order(nom asc)[0...8]{ ${CARTE_FIELDS} }`;

/** « À proximité » : par distance si la fiche a une position, sinon même territoire. */
export const PROCHES_GEO_QUERY = `*[_type == "adherent" && _id != $id && defined(localisation)]
  | order(geo::distance(localisation, $point) asc)[0...8]{ ${CARTE_FIELDS} }`;
export const PROCHES_TERRITOIRE_QUERY = `*[_type == "adherent" && _id != $id && territoire._ref == $territoire && branche._ref != $branche]
  | order(nom asc)[0...8]{ ${CARTE_FIELDS} }`;

/** Libellés affichés pour les valeurs du champ « publics ». */
const PUBLIC_LABELS: Record<string, string> = {
  Famille: 'En famille',
  Enfants: 'Avec des enfants',
  Amis: 'Entre amis',
  Adultes: 'Adultes',
  Tous: 'Tous publics',
  'Team building': 'Team building',
};

export function labelPublic(valeur: string): string {
  return PUBLIC_LABELS[valeur] ?? valeur;
}

export const SAISONS = ['Printemps', 'Été', 'Automne', 'Hiver'] as const;
export type Saison = (typeof SAISONS)[number];

/** Périodes d'ouverture : le nouveau champ « periodes », sinon déduites de l'ancien champ « saison ». */
export function periodesOuverture(periodes?: string[] | null, saison?: string | null): Saison[] {
  const valides = (periodes ?? []).filter((p): p is Saison => (SAISONS as readonly string[]).includes(p));
  if (valides.length) return SAISONS.filter((s) => valides.includes(s));
  if (saison === 'Toute saison') return [...SAISONS];
  if (saison === 'Été') return ['Été'];
  if (saison === 'Hiver') return ['Hiver'];
  return [];
}

/** Branches considérées comme « Sensations » (puce de la page d'accueil). */
export const BRANCHES_SENSATIONS = [
  'sports-mecaniques-66',
  'glisse-66',
  'glisse-montagne-66',
  'parcours-aventure-66',
  'activites-a-corde-et-pleine-nature-66',
  'activites-nautiques-watergames-66',
];

/** Raccourcis de la page d'accueil (bandeau corail) → paramètres de /recherche. */
export const RACCOURCIS = [
  { label: 'En famille', params: { public: 'famille' } },
  { label: 'Sensations', params: { ambiance: 'sensations' } },
  { label: 'En intérieur', params: { type: 'indoor' } },
  { label: 'Groupes & entreprises', params: { groupe: 'groupes & entreprises' } },
] as const;

export function urlRecherche(params: Record<string, string>): string {
  const qs = new URLSearchParams(params).toString();
  return qs ? `/recherche?${qs}` : '/recherche';
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
  type?: string;
  groupe?: string;
  ambiance?: string;
};

export const CRITERES: (keyof CritereRecherche)[] = ['q', 'univers', 'territoire', 'public', 'type', 'groupe', 'ambiance'];

/** Lit les critères depuis l'URL (valeurs vides ignorées). */
export function lireCriteres(params: URLSearchParams): CritereRecherche {
  const c: CritereRecherche = {};
  for (const k of CRITERES) {
    const v = params.get(k)?.trim();
    if (v) c[k] = v;
  }
  return c;
}

const sansAccents = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

/** Filtre les activités selon les critères de /recherche. `univers` : slug → slugs de branches. */
export function filtrerActivites<T extends Record<string, any>>(
  activites: T[],
  c: CritereRecherche,
  univers: Record<string, string[]> = {},
): T[] {
  const mots = c.q ? sansAccents(c.q).split(/\s+/).filter(Boolean) : [];
  const egal = (a?: string | null, b?: string) => sansAccents(a ?? '') === sansAccents(b ?? '');
  return activites.filter((a) => {
    if (mots.length) {
      const texte = sansAccents([a.nom, a.soustitre, a.description, a.ville, a.branche?.titre].filter(Boolean).join(' '));
      if (!mots.every((m) => texte.includes(m))) return false;
    }
    if (c.univers && !(univers[c.univers] ?? []).includes(a.branche?.slug)) return false;
    if (c.territoire && a.territoire?.slug !== c.territoire) return false;
    if (c.type && !egal(a.type, c.type)) return false;
    if (c.public && !(a.publics ?? []).some((p: string) => egal(p, c.public))) return false;
    if (c.groupe && !(a.groupes ?? []).some((g: string) => egal(g, c.groupe))) return false;
    if (c.ambiance === 'sensations' && !BRANCHES_SENSATIONS.includes(a.branche?.slug)) return false;
    return true;
  });
}

/** URL de /recherche avec un critère ajouté, remplacé ou retiré (s'il était déjà actif avec cette valeur). */
export function basculerCritere(c: CritereRecherche, cle: keyof CritereRecherche, valeur: string): string {
  const suivant: Record<string, string> = {};
  for (const [k, v] of Object.entries(c)) if (v) suivant[k] = v;
  if (suivant[cle] === valeur) delete suivant[cle];
  else suivant[cle] = valeur;
  return urlRecherche(suivant);
}

/** Photo à afficher : celle de l'adhérent, sinon celle de sa branche (toutes les branches en ont une). */
export function photoPrincipale(a: { image?: any; branche?: { image?: any } | null }): any | null {
  if (a.image?.asset) return a.image;
  if (a.branche?.image?.asset) return a.branche.image;
  return null;
}
