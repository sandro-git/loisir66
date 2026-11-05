// Espace adhérent : champs que la structure peut modifier elle-même sur sa fiche (testé dans tests/unit/profil.test.ts).
// Branche, univers, territoires, itinérance et date d'adhésion restent gérés par l'APLPO dans le Studio.
import { CADRES, EXPERIENCES, GROUPES, PUBLICS, SAISONS } from './contenu';

export const LIMITES = { accroche: 70, description: 600, activites: 4 };

type Lecteur = { get(k: string): FormDataEntryValue | null; getAll(k: string): FormDataEntryValue[] };

const texte = (f: Lecteur, k: string) => String(f.get(k) ?? '').trim();
const parmi = (f: Lecteur, k: string, valeurs: readonly string[]) =>
  f.getAll(k).map(String).filter((v) => valeurs.includes(v));

/** Construit le patch Sanity depuis le formulaire (valeurs hors référentiel ignorées, limites appliquées). */
export function patchProfil(f: Lecteur): { set: Record<string, unknown>; unset: string[]; erreurs: string[] } {
  const erreurs: string[] = [];
  const set: Record<string, unknown> = {};
  const unset: string[] = [];

  const nom = texte(f, 'nom');
  if (!nom) erreurs.push('Le nom est obligatoire.');
  else set.nom = nom;

  const accroche = texte(f, 'accroche');
  if (accroche.length > LIMITES.accroche) erreurs.push(`L’accroche dépasse ${LIMITES.accroche} caractères.`);
  const description = texte(f, 'description');
  if (description.length > LIMITES.description) erreurs.push(`La présentation dépasse ${LIMITES.description} caractères.`);
  const activites = f.getAll('activites').map((v) => String(v).trim()).filter(Boolean);
  if (activites.length > LIMITES.activites) erreurs.push(`${LIMITES.activites} activités maximum.`);

  const siteWeb = texte(f, 'siteWeb');
  if (siteWeb && !/^https?:\/\/[^\s]+\.[^\s]+/.test(siteWeb)) erreurs.push('L’adresse du site web doit commencer par https://');

  const champsTexte: Record<string, string> = { accroche, description, ville: texte(f, 'ville'), adresse: texte(f, 'adresse'), siteWeb };
  for (const [k, v] of Object.entries(champsTexte)) {
    if (v) set[k] = v;
    else unset.push(k);
  }

  set.activites = activites.slice(0, LIMITES.activites);
  set.publics = parmi(f, 'publics', Object.keys(PUBLICS));
  set.groupes = parmi(f, 'groupes', GROUPES);
  set.experiences = parmi(f, 'experiences', EXPERIENCES);
  set.cadres = parmi(f, 'cadres', CADRES);
  set.periodes = parmi(f, 'periodes', SAISONS);

  return { set, unset, erreurs };
}
