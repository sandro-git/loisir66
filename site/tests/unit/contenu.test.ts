import { describe, expect, it } from 'vitest';
import {
  basculerCritere,
  filtrerActivites,
  formatDistance,
  labelPublic,
  lignesAdresse,
  lireCriteres,
  nomLisible,
  periodesOuverture,
  photoPrincipale,
  urlItineraire,
  urlRecherche,
} from '../../src/lib/contenu';

describe('nomLisible', () => {
  it('remet en casse lisible un nom saisi en capitales', () => {
    expect(nomLisible('PARC ANIMALIER DE CASTEIL')).toBe('Parc Animalier de Casteil');
    expect(nomLisible('LE JARDIN D’ARIANE')).toBe('Le Jardin d’Ariane');
  });
  it('conserve un nom déjà en casse mixte', () => {
    expect(nomLisible('VR Café')).toBe('VR Café');
    expect(nomLisible('EcoZonia')).toBe('EcoZonia');
  });
});

describe('labelPublic', () => {
  it('traduit les valeurs Sanity en libellés de la maquette', () => {
    expect(labelPublic('Famille')).toBe('En famille');
    expect(labelPublic('Enfants')).toBe('Avec des enfants');
    expect(labelPublic('Amis')).toBe('Entre amis');
    expect(labelPublic('Inconnu')).toBe('Inconnu');
  });
});

describe('periodesOuverture', () => {
  it('utilise le champ periodes dans l’ordre des saisons', () => {
    expect(periodesOuverture(['Hiver', 'Printemps'], null)).toEqual(['Printemps', 'Hiver']);
  });
  it('se replie sur l’ancien champ saison', () => {
    expect(periodesOuverture(null, 'Toute saison')).toEqual(['Printemps', 'Été', 'Automne', 'Hiver']);
    expect(periodesOuverture([], 'Été')).toEqual(['Été']);
    expect(periodesOuverture(undefined, undefined)).toEqual([]);
  });
});

describe('formatDistance', () => {
  it('arrondit au kilomètre', () => {
    expect(formatDistance(24.6)).toBe('À 25 km');
    expect(formatDistance(0.4)).toBe('À moins d’1 km');
    expect(formatDistance(Infinity)).toBe('');
  });
});

describe('lignesAdresse / urlItineraire', () => {
  it('découpe l’adresse sur les retours à la ligne ou les virgules', () => {
    expect(lignesAdresse('Rue du Cady\n66820 Casteil')).toEqual(['Rue du Cady', '66820 Casteil']);
    expect(lignesAdresse('Canet-en-Roussillon, 66140')).toEqual(['Canet-en-Roussillon', '66140']);
    expect(lignesAdresse(null)).toEqual([]);
  });
  it('privilégie la position GPS, sinon l’adresse', () => {
    expect(urlItineraire({ lat: 42.5, lng: 2.4 })).toBe('https://www.google.com/maps/dir/?api=1&destination=42.5,2.4');
    expect(urlItineraire({ adresse: 'Rue du Cady\n66820 Casteil' })).toContain(encodeURIComponent('Rue du Cady, 66820 Casteil'));
    expect(urlItineraire({})).toBeNull();
  });
});

describe('photoPrincipale', () => {
  const img = (id: string) => ({ asset: { _ref: id } });
  it('prend la photo de l’adhérent, sinon celle de sa branche', () => {
    expect(photoPrincipale({ image: img('a'), branche: { image: img('b') } })).toEqual(img('a'));
    expect(photoPrincipale({ branche: { image: img('b') } })).toEqual(img('b'));
    expect(photoPrincipale({})).toBeNull();
  });
});

describe('recherche', () => {
  const activites = [
    { nom: 'Parc animalier de Casteil', description: 'Lions et loups', type: 'Outdoor', publics: ['Famille'], groupes: ['Scolaires'], branche: { slug: 'parcs-animaliers-aquariums-66', titre: 'Parcs' }, territoire: { slug: 'montagne' } },
    { nom: 'Karting de Torreilles', description: 'Pilotage', type: 'Outdoor', publics: ['Adultes'], branche: { slug: 'sports-mecaniques-66', titre: 'Sports mécaniques' }, territoire: { slug: 'cote-sableuse' } },
    { nom: 'VR Café', description: 'Réalité virtuelle', type: 'Indoor', publics: ['Famille', 'Enfants'], groupes: ['Groupes & entreprises'], branche: { slug: 'parcs-indoor-multijeux-66', titre: 'Parcs Indoor' } },
  ];
  const noms = (xs: typeof activites) => xs.map((a) => a.nom);

  it('lit les critères non vides de l’URL', () => {
    expect(lireCriteres(new URLSearchParams('q=+kart+&type=&univers=animaux&autre=x'))).toEqual({ q: 'kart', univers: 'animaux' });
  });
  it('cherche dans le texte sans tenir compte des accents ni de la casse', () => {
    expect(noms(filtrerActivites(activites, { q: 'REALITE' }))).toEqual(['VR Café']);
    expect(noms(filtrerActivites(activites, { q: 'parc lions' }))).toEqual(['Parc animalier de Casteil']);
  });
  it('filtre par univers (via ses branches), territoire, type, public, groupe et ambiance', () => {
    const univers = { animaux: ['parcs-animaliers-aquariums-66', 'fermes-66'] };
    expect(noms(filtrerActivites(activites, { univers: 'animaux' }, univers))).toEqual(['Parc animalier de Casteil']);
    expect(noms(filtrerActivites(activites, { univers: 'inconnu' }, univers))).toEqual([]);
    expect(noms(filtrerActivites(activites, { territoire: 'cote-sableuse' }))).toEqual(['Karting de Torreilles']);
    expect(noms(filtrerActivites(activites, { type: 'indoor' }))).toEqual(['VR Café']);
    expect(noms(filtrerActivites(activites, { public: 'famille' }))).toEqual(['Parc animalier de Casteil', 'VR Café']);
    expect(noms(filtrerActivites(activites, { groupe: 'groupes & entreprises' }))).toEqual(['VR Café']);
    expect(noms(filtrerActivites(activites, { ambiance: 'sensations' }))).toEqual(['Karting de Torreilles']);
  });
  it('ajoute, remplace ou retire un critère dans l’URL', () => {
    expect(basculerCritere({ q: 'parc' }, 'type', 'indoor')).toBe('/recherche?q=parc&type=indoor');
    expect(basculerCritere({ type: 'indoor' }, 'type', 'outdoor')).toBe('/recherche?type=outdoor');
    expect(basculerCritere({ type: 'indoor' }, 'type', 'indoor')).toBe('/recherche');
    expect(urlRecherche({ groupe: 'groupes & entreprises' })).toBe('/recherche?groupe=groupes+%26+entreprises');
  });
});
