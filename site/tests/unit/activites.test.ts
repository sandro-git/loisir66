import { describe, expect, it } from 'vitest';
import {
  buildFilterOptions,
  countLabel,
  getFallbackImg,
  haversine,
  matchesFilters,
  toTitleCase,
  type Filters,
} from '../../src/lib/activites';

const noFilters: Filters = { type: '', public: '', saison: '', ville: '', branche: '' };

describe('toTitleCase', () => {
  it('met une majuscule à chaque mot', () => {
    expect(toTitleCase('CANET EN ROUSSILLON')).toBe('Canet En Roussillon');
  });

  it('gère les tirets et les slashs', () => {
    expect(toTitleCase('font-romeu')).toBe('Font-Romeu');
    expect(toTitleCase('paintball factory / le bar')).toBe('Paintball Factory / Le Bar');
  });

  it('conserve les accents', () => {
    expect(toTitleCase('ÉTÉ À PERPIGNAN')).toBe('Été À Perpignan');
  });

  it('renvoie la valeur telle quelle si elle est vide', () => {
    expect(toTitleCase('')).toBe('');
  });
});

describe('buildFilterOptions', () => {
  const activites = [
    { type: 'Outdoor', publics: ['Famille', 'Enfants'], saison: 'Été', ville: 'Leucate' },
    { type: 'Indoor', publics: ['Adultes'], saison: 'Toute saison', ville: 'Cabestany' },
    { type: 'Outdoor', publics: ['Famille'], saison: 'Été', ville: null },
    { type: null, publics: null, saison: null, ville: 'Leucate' },
  ];

  it('déduplique et trie types et villes', () => {
    const o = buildFilterOptions(activites);
    expect(o.types).toEqual(['Indoor', 'Outdoor']);
    expect(o.villes).toEqual(['Cabestany', 'Leucate']);
  });

  it("déduplique publics et saisons en gardant l'ordre d'apparition", () => {
    const o = buildFilterOptions(activites);
    expect(o.publics).toEqual(['Famille', 'Enfants', 'Adultes']);
    expect(o.saisons).toEqual(['Été', 'Toute saison']);
  });

  it('renvoie des listes vides sans activité', () => {
    expect(buildFilterOptions([])).toEqual({ types: [], publics: [], saisons: [], villes: [] });
  });
});

describe('matchesFilters', () => {
  const card = {
    nom: 'karting de torreilles',
    description: 'circuit de karting en plein air',
    type: 'outdoor',
    public: 'famille,adultes',
    saison: 'toute saison',
    ville: 'torreilles',
    branche: 'sports-aventure',
  };

  it('affiche tout sans recherche ni filtre', () => {
    expect(matchesFilters(card, '', noFilters)).toBe(true);
  });

  it('cherche dans le nom et dans la description', () => {
    expect(matchesFilters(card, 'torreilles', noFilters)).toBe(true);
    expect(matchesFilters(card, 'plein air', noFilters)).toBe(true);
    expect(matchesFilters(card, 'plongée', noFilters)).toBe(false);
  });

  it('applique chaque filtre en égalité stricte', () => {
    expect(matchesFilters(card, '', { ...noFilters, type: 'outdoor' })).toBe(true);
    expect(matchesFilters(card, '', { ...noFilters, type: 'indoor' })).toBe(false);
    expect(matchesFilters(card, '', { ...noFilters, saison: 'été' })).toBe(false);
    expect(matchesFilters(card, '', { ...noFilters, ville: 'torreilles' })).toBe(true);
    expect(matchesFilters(card, '', { ...noFilters, branche: 'bien-etre' })).toBe(false);
  });

  it('accepte un public parmi plusieurs', () => {
    expect(matchesFilters(card, '', { ...noFilters, public: 'adultes' })).toBe(true);
    expect(matchesFilters(card, '', { ...noFilters, public: 'enfants' })).toBe(false);
  });

  it('combine recherche et filtres (ET logique)', () => {
    expect(matchesFilters(card, 'karting', { ...noFilters, type: 'outdoor', public: 'famille' })).toBe(true);
    expect(matchesFilters(card, 'karting', { ...noFilters, type: 'indoor' })).toBe(false);
  });

  it('tolère une carte sans données', () => {
    expect(matchesFilters({}, '', noFilters)).toBe(true);
    expect(matchesFilters({}, 'x', noFilters)).toBe(false);
    expect(matchesFilters({}, '', { ...noFilters, type: 'outdoor' })).toBe(false);
  });
});

describe('countLabel', () => {
  it('accorde au singulier et au pluriel', () => {
    expect(countLabel(0)).toBe('0 activité trouvée');
    expect(countLabel(1)).toBe('1 activité trouvée');
    expect(countLabel(64)).toBe('64 activités trouvées');
  });
});

describe('haversine', () => {
  it('vaut 0 pour un même point', () => {
    expect(haversine(42.6986, 2.8956, 42.6986, 2.8956)).toBe(0);
  });

  it('calcule Perpignan → Canet-en-Roussillon (≈ 11 km)', () => {
    const d = haversine(42.6986, 2.8956, 42.7058, 3.0080);
    expect(d).toBeGreaterThan(8);
    expect(d).toBeLessThan(12);
  });

  it('est symétrique', () => {
    expect(haversine(42.69, 2.89, 42.5, 1.99)).toBeCloseTo(haversine(42.5, 1.99, 42.69, 2.89), 10);
  });
});

describe('getFallbackImg', () => {
  const id = (url: string) => url.match(/photo-([^?]+)/)?.[1];

  it('choisit une image selon un mot-clé du nom', () => {
    expect(id(getFallbackImg('KARTING DE TORREILLES', 'Outdoor'))).toBe('1568772585407-9f3a8f8b4b4a');
    expect(id(getFallbackImg('Plongée Cap Cerbère', 'Outdoor'))).toBe('1544551763-46a013bb70d5');
  });

  it("ne tient pas compte de la casse", () => {
    expect(getFallbackImg('SPA PRIVATIF', 'Indoor')).toBe(getFallbackImg('spa privatif', 'Indoor'));
  });

  it('applique le premier mot-clé trouvé dans la liste', () => {
    // « aqua » (plongée) est testé avant « parc » (aventure)
    expect(id(getFallbackImg('Aquaparc', 'Outdoor'))).toBe('1544551763-46a013bb70d5');
  });

  it('a une image par défaut différente pour Indoor et Outdoor', () => {
    expect(id(getFallbackImg('Zzz', 'Indoor'))).toBe('1571019613454-1cb2f99b2d8b');
    expect(id(getFallbackImg('Zzz', 'Outdoor'))).toBe('1506905925346-21bda4d32df4');
    expect(id(getFallbackImg('Zzz', ''))).toBe('1506905925346-21bda4d32df4');
  });

  it('renvoie une URL Unsplash recadrée', () => {
    expect(getFallbackImg('golf', 'Outdoor')).toMatch(
      /^https:\/\/images\.unsplash\.com\/photo-[\w-]+\?auto=format&fit=crop&w=480&h=200&q=80$/,
    );
  });
});
