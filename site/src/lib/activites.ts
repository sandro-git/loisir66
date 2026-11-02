// Logique pure de la page d'accueil (recherche, filtres, distances, images de repli).
// Extraite de pages/index.astro pour être testée unitairement (tests/unit/activites.test.ts).

export type Filters = {
  type: string;
  public: string;
  saison: string;
  ville: string;
  branche: string;
};

/** Données portées par chaque carte (attributs data-*, déjà en minuscules). */
export type CardData = {
  nom?: string;
  description?: string;
  type?: string;
  public?: string; // publics séparés par des virgules
  saison?: string;
  ville?: string;
  branche?: string;
};

export type ActiviteSource = {
  type?: string | null;
  publics?: string[] | null;
  saison?: string | null;
  ville?: string | null;
};

export function toTitleCase(str: string): string {
  if (!str) return str;
  return str.toLowerCase().replace(/(?:^|[\s\-\/])\S/g, (c) => c.toUpperCase());
}

/** Valeurs distinctes proposées comme filtres (types et villes triés, publics et saisons dans l'ordre d'apparition). */
export function buildFilterOptions(activites: ActiviteSource[]) {
  const uniq = <T,>(xs: (T | null | undefined)[]) => [...new Set(xs.filter(Boolean) as T[])];
  return {
    types:   uniq(activites.map((a) => a.type)).sort() as string[],
    publics: uniq(activites.flatMap((a) => a.publics ?? [])) as string[],
    saisons: uniq(activites.map((a) => a.saison)) as string[],
    villes:  uniq(activites.map((a) => a.ville)).sort() as string[],
  };
}

/** Une carte est visible si elle correspond à la recherche ET à chaque filtre actif. */
export function matchesFilters(card: CardData, query: string, filters: Partial<Filters>): boolean {
  return (
    (!query           || (card.nom ?? '').includes(query) || (card.description ?? '').includes(query)) &&
    (!filters.type    || (card.type ?? '') === filters.type) &&
    (!filters.public  || (card.public ?? '').includes(filters.public)) &&
    (!filters.saison  || (card.saison ?? '') === filters.saison) &&
    (!filters.ville   || (card.ville ?? '') === filters.ville) &&
    (!filters.branche || (card.branche ?? '') === filters.branche)
  );
}

/** « 1 activité trouvée » / « 3 activités trouvées ». */
export function countLabel(visible: number): string {
  const s = visible > 1 ? 's' : '';
  return `${visible} activité${s} trouvée${s}`;
}

/** Distance à vol d'oiseau en km entre deux points GPS. */
export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getFallbackImg(nom: string, type: string): string {
  const n = nom.toLowerCase();
  const q = '?auto=format&fit=crop&w=480&h=200&q=80';
  const u = 'https://images.unsplash.com/photo-';
  const checks: [string[], string][] = [
    [['ski','neige','alpin','romeu','2000','snowboard','hiver','glisse'],       '1551698618-1dfe5d97d256'],
    [['plongée','diving','aqua','snorkel','corail'],                            '1544551763-46a013bb70d5'],
    [['nautique','voile','kayak','canoe','canoë','bateau','régate','surf'],      '1530053969600-caed2596d242'],
    [['escalade','grimpe','via ferrata','bloc','varappe'],                      '1522163182402-834f871fd851'],
    [['vélo','vtt','cyclisme','bmx','bike','cycle'],                            '1558618666-fcd25c85cd64'],
    [['cheval','équi','horse','poney','ranch','polo'],                          '1553284965-83fd3e82fa5a'],
    [['ferme','élevage','âne','poule','animaux de la'],                         '1500595046743-cd271d694d30'],
    [['tortue','reptile','terrarium'],                                          '1548550804-f38e88d0e2f6'],
    [['jardin','botanique','fleur','ariane','potager','plante'],                '1416879595882-3373a0480b5b'],
    [['vin','wine','dégustation','cave','vigne','vendange'],                    '1506377247377-2a5b3b417ebb'],
    [['children','paradise','enfant','kids','ludique','jeux','trampoline'],     '1566127444979-2707e8df55bb'],
    [['yoga','pilates','méditation','zen','sophrologie','bien-être'],           '1544367567-0f2fcb009e0b'],
    [['cuisine','gastro','cook','chef','pâtisserie','atelier culinaire'],       '1556909114-f6e7ad7d3136'],
    [['randonnée','trek','rando','hiking','marche nordique'],                   '1483728642387-6c3bdd6c93e5'],
    [['parc','acrobat','accro','tyrolienne','arbre','forêt','aventure'],        '1505765050516-f72dc741e925'],
    [['laser','paintball','airsoft','escape','room'],                           '1612170153604-b7f7af55e94b'],
    [['vr','réalité virtuelle','virtuel'],                                      '1617802690658-1173a812650d'],
    [['karting','kart','circuit','moto'],                                       '1568772585407-9f3a8f8b4b4a'],
    [['golf'],                                                                  '1537175467824-4c4e817c1bbe'],
    [['tennis','padel','squash','badminton'],                                   '1554068865-24cecd4e34b8'],
    [['musique','chant','concert','orchestre'],                                 '1511671001-8673-4aff-aea9-cd955b631f6b'],
    [['photo','photographie'],                                                  '1516035069371-29a1b244cc32'],
    [['musée','expo','patrimoine','château','visite'],                          '1554907984-15263bfd63bd'],
    [['théâtre','spectacle','danse','ballet'],                                  '1507608168822-ecf2f7f7e8fd'],
    [['pêche','fishing'],                                                       '1548438294-1ad5d5f4f063'],
    [['spa','massage','bain','détente','thermal'],                              '1540555700478-4be289fbecef'],
    [['peinture','dessin','art','poterie','céramique'],                         '1513364776144-60967b0f800f'],
  ];
  for (const [keywords, id] of checks) {
    if (keywords.some(k => n.includes(k))) return u + id + q;
  }
  if (type === 'Indoor') return u + '1571019613454-1cb2f99b2d8b' + q;
  return u + '1506905925346-21bda4d32df4' + q;
}
