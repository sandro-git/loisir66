import { describe, expect, it } from 'vitest';
import { patchProfil } from '../../src/lib/profil';

const formulaire = (champs: [string, string][]) => {
  const f = new FormData();
  for (const [k, v] of champs) f.append(k, v);
  return f;
};

describe('patchProfil', () => {
  it('garde les valeurs du référentiel et ignore le reste', () => {
    const { set, unset, erreurs } = patchProfil(formulaire([
      ['nom', ' VR Café '], ['accroche', 'Expérience immersive en réalité virtuelle'],
      ['publics', 'Famille'], ['publics', 'Inventé'], ['groupes', 'Anniversaires'], ['periodes', 'Hiver'],
      ['activites', 'Escape game VR'], ['activites', ''], ['ville', ''],
    ]));
    expect(erreurs).toEqual([]);
    expect(set).toMatchObject({ nom: 'VR Café', publics: ['Famille'], groupes: ['Anniversaires'], periodes: ['Hiver'], activites: ['Escape game VR'] });
    expect(unset).toContain('ville');
  });
  it('signale les dépassements de limites et un site web invalide', () => {
    const { erreurs } = patchProfil(formulaire([
      ['nom', 'X'], ['accroche', 'a'.repeat(71)], ['description', 'b'.repeat(601)],
      ...[1, 2, 3, 4, 5].map((i) => ['activites', `A${i}`] as [string, string]), ['siteWeb', 'mon-site'],
    ]));
    expect(erreurs).toHaveLength(4);
  });
  it('exige un nom', () => {
    expect(patchProfil(formulaire([['nom', '  ']])).erreurs).toContain('Le nom est obligatoire.');
  });
});
