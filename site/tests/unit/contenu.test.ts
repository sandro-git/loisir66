import { describe, expect, it } from 'vitest';
import {
  basculerCritere,
  cadresEffectifs,
  classerParMembres,
  experiencesEffectives,
  groupesEffectifs,
  lieuAffiche,
  publicsAffiches,
  trierParAnciennete,
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
    expect(labelPublic('Adultes')).toBe('Entre adultes');
    expect(labelPublic('Chiens')).toBe('Chiens bienvenus');
    expect(labelPublic('Tous')).toBe('Tous publics');
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

describe('valeurs effectives (anciens champs)', () => {
  it('« Team building » dans publics devient un groupe', () => {
    expect(publicsAffiches(['Famille', 'Team building'])).toEqual(['En famille']);
    expect(groupesEffectifs({ publics: ['Team building'], groupes: ['Scolaires'] })).toEqual(['Scolaires', 'Team building']);
  });
  it('le cadre se déduit du type et des territoires tant qu’il n’est pas saisi', () => {
    expect(cadresEffectifs({ type: 'Outdoor', territoires: [{ slug: 'cote-sableuse' }] })).toEqual(['En plein air', 'Côté mer']);
    expect(cadresEffectifs({ type: 'Indoor', territoires: [{ slug: 'montagne' }] })).toEqual(['En intérieur', 'En montagne']);
    expect(cadresEffectifs({ cadres: ['Côté terre'], type: 'Indoor' })).toEqual(['Côté terre']);
  });
  it('l’expérience se déduit de la branche tant qu’elle n’est pas saisie', () => {
    expect(experiencesEffectives({ branche: { slug: 'sports-mecaniques-66' } })).toEqual(['Sensations']);
    expect(experiencesEffectives({ branche: { slug: 'fermes-66' } })).toEqual(['Rencontre avec les animaux']);
    expect(experiencesEffectives({ experiences: ['Détente'], branche: { slug: 'glisse-66' } })).toEqual(['Détente']);
  });
});

describe('itinérants', () => {
  it('affiche « Itinérant – secteur » plutôt qu’une ville', () => {
    expect(lieuAffiche({ itinerant: true, secteur: 'Tout le 66', ville: 'Perpignan' })).toBe('Itinérant – Tout le 66');
    expect(lieuAffiche({ itinerant: true })).toBe('Itinérant');
    expect(lieuAffiche({ ville: 'CASTEIL' })).toBe('Casteil');
    expect(lieuAffiche({})).toBeNull();
  });
});

describe('classements', () => {
  it('ancienneté d’adhésion croissante, sans date en dernier, puis nom', () => {
    const xs = [{ nom: 'Zèbre' }, { nom: 'Beta', dateAdhesion: '2015-01-01' }, { nom: 'alpha' }, { nom: 'Gamma', dateAdhesion: '2010-06-01' }];
    expect(trierParAnciennete(xs).map((x) => x.nom)).toEqual(['Gamma', 'Beta', 'alpha', 'Zèbre']);
  });
  it('univers par nombre de membres (branche principale + univers secondaire)', () => {
    const univers = [
      { slug: 'animaux-ferme', titre: 'Animaux & ferme', branches: ['fermes-66'] },
      { slug: 'sport-aventure', titre: 'Sport & Aventure', branches: ['velo-66'] },
    ];
    const membres = [
      { branche: { slug: 'fermes-66' } },
      { branche: { slug: 'velo-66' } },
      { branche: { slug: 'velo-66' } },
      { branche: { slug: 'fermes-66' }, universSecondaire: 'sport-aventure' },
    ];
    expect(classerParMembres(univers, membres, 'univers').map((u) => `${u.slug}:${u.membres}`)).toEqual(['sport-aventure:3', 'animaux-ferme:2']);
  });
});

describe('recherche', () => {
  const activites = [
    { nom: 'Parc animalier de Casteil', description: 'Lions et loups', type: 'Outdoor', publics: ['Famille'], groupes: ['Scolaires'], periodes: ['Été'], universSecondaire: 'sport-aventure', branche: { slug: 'parcs-animaliers-aquariums-66', titre: 'Parcs' }, territoires: [{ slug: 'montagne', titre: 'Montagne' }] },
    { nom: 'Karting de Torreilles', description: 'Pilotage', activites: ['Kart enfant'], type: 'Outdoor', publics: ['Adultes'], branche: { slug: 'sports-mecaniques-66', titre: 'Sports mécaniques' }, territoires: [{ slug: 'cote-sableuse' }] },
    { nom: 'VR Café', description: 'Réalité virtuelle', type: 'Indoor', publics: ['Famille', 'Enfants'], groupes: ['Entreprises & équipes'], saison: 'Toute saison', branche: { slug: 'parcs-indoor-multijeux-66', titre: 'Parcs Indoor' } },
  ];
  const univers = [
    { slug: 'animaux-ferme', branches: ['parcs-animaliers-aquariums-66', 'fermes-66'] },
    { slug: 'sport-aventure', branches: ['sports-mecaniques-66'] },
  ];
  const noms = (xs: typeof activites) => xs.map((a) => a.nom);

  it('lit les critères de l’URL et convertit les anciens paramètres', () => {
    expect(lireCriteres(new URLSearchParams('q=+kart+&cadre=&univers=animaux&autre=x'))).toEqual({ q: 'kart', univers: 'animaux' });
    expect(lireCriteres(new URLSearchParams('type=indoor&ambiance=sensations'))).toEqual({ cadre: 'en intérieur', experience: 'sensations' });
  });
  it('cherche dans le texte, les activités et les tags, sans accents ni casse', () => {
    expect(noms(filtrerActivites(activites, { q: 'REALITE' }))).toEqual(['VR Café']);
    expect(noms(filtrerActivites(activites, { q: 'kart enfant' }))).toEqual(['Karting de Torreilles']);
    expect(noms(filtrerActivites(activites, { q: 'montagne' }))).toEqual(['Parc animalier de Casteil']);
  });
  it('filtre par univers principal ou secondaire', () => {
    expect(noms(filtrerActivites(activites, { univers: 'animaux-ferme' }, univers))).toEqual(['Parc animalier de Casteil']);
    expect(noms(filtrerActivites(activites, { univers: 'sport-aventure' }, univers))).toEqual(['Parc animalier de Casteil', 'Karting de Torreilles']);
    expect(noms(filtrerActivites(activites, { univers: 'inconnu' }, univers))).toEqual([]);
  });
  it('filtre par territoire, cadre, public, groupe, expérience et saison', () => {
    expect(noms(filtrerActivites(activites, { territoire: 'cote-sableuse' }))).toEqual(['Karting de Torreilles']);
    expect(noms(filtrerActivites(activites, { cadre: 'en intérieur' }))).toEqual(['VR Café']);
    expect(noms(filtrerActivites(activites, { cadre: 'côté mer' }))).toEqual(['Karting de Torreilles']);
    expect(noms(filtrerActivites(activites, { public: 'famille' }))).toEqual(['Parc animalier de Casteil', 'VR Café']);
    expect(noms(filtrerActivites(activites, { groupe: 'tous' }))).toEqual(['Parc animalier de Casteil', 'VR Café']);
    expect(noms(filtrerActivites(activites, { groupe: 'entreprises & équipes' }))).toEqual(['VR Café']);
    expect(noms(filtrerActivites(activites, { experience: 'sensations' }))).toEqual(['Karting de Torreilles']);
    expect(noms(filtrerActivites(activites, { saison: 'hiver' }))).toEqual(['VR Café']);
  });
  it('ajoute, remplace ou retire un critère dans l’URL', () => {
    expect(basculerCritere({ q: 'parc' }, 'cadre', 'en intérieur')).toBe('/recherche?q=parc&cadre=en+int%C3%A9rieur');
    expect(basculerCritere({ cadre: 'en intérieur' }, 'cadre', 'en plein air')).toBe('/recherche?cadre=en+plein+air');
    expect(basculerCritere({ cadre: 'En intérieur' }, 'cadre', 'en intérieur')).toBe('/recherche');
    expect(urlRecherche({ groupe: 'tous' })).toBe('/recherche?groupe=tous');
  });
});
