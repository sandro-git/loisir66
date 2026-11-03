// Logique pure : distance GPS et images de repli des cartes d'activité
// (tests/unit/activites.test.ts).

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
    [['tortue','reptile','terrarium'],                                          '1575550959106-5a7defe28b56'],
    [['jardin','botanique','fleur','ariane','potager','plante'],                '1416879595882-3373a0480b5b'],
    [['vin','wine','dégustation','cave','vigne','vendange'],                    '1506377247377-2a5b3b417ebb'],
    [['children','paradise','enfant','kids','ludique','jeux','trampoline'],     '1764715978815-8e349d115717'],
    [['yoga','pilates','méditation','zen','sophrologie','bien-être'],           '1544367567-0f2fcb009e0b'],
    [['cuisine','gastro','cook','chef','pâtisserie','atelier culinaire'],       '1556909114-f6e7ad7d3136'],
    [['randonnée','trek','rando','hiking','marche nordique'],                   '1483728642387-6c3bdd6c93e5'],
    [['parc','acrobat','accro','tyrolienne','arbre','forêt','aventure'],        '1522163182402-834f871fd851'],
    [['laser','paintball','airsoft','escape','room'],                           '1585676264910-f3b939b562d0'],
    [['vr','réalité virtuelle','virtuel'],                                      '1617802690658-1173a812650d'],
    [['karting','kart','circuit','moto'],                                       '1571019613454-1cb2f99b2d8b'],
    [['golf'],                                                                  '1778058616587-06db26b6db15'],
    [['tennis','padel','squash','badminton'],                                   '1554068865-24cecd4e34b8'],
    [['musique','chant','concert','orchestre'],                                 '1653987255814-3b4c05832660'],
    [['photo','photographie'],                                                  '1516035069371-29a1b244cc32'],
    [['musée','expo','patrimoine','château','visite'],                          '1554907984-15263bfd63bd'],
    [['théâtre','spectacle','danse','ballet'],                                  '1653987255814-3b4c05832660'],
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
