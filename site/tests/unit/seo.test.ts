import { describe, expect, it } from 'vitest';
import { adressePostale, jsonLdFiche, sitemapXml } from '../../src/lib/seo';

describe('adressePostale', () => {
  it('sépare rue, code postal et commune', () => {
    expect(adressePostale('Rue du Cady\n66820 Casteil')).toMatchObject({ streetAddress: 'Rue du Cady', postalCode: '66820', addressLocality: 'Casteil', addressCountry: 'FR' });
    expect(adressePostale(null, 'PERPIGNAN')).toMatchObject({ addressLocality: 'Perpignan' });
    expect(adressePostale(null, null)).toBeNull();
  });
});

describe('jsonLdFiche', () => {
  const base = { nom: 'PARC ANIMALIER DE CASTEIL', accroche: 'Une échappée sauvage', siteWeb: 'https://parc.fr', activites: ['Visite'], localisation: { lat: 42.5, lng: 2.4 }, adresse: 'Rue du Cady\n66820 Casteil' };
  it('décrit un lieu fixe avec adresse et position', () => {
    const j: any = jsonLdFiche(base, { url: 'https://site/loisirs66/casteil' });
    expect(j.name).toBe('Parc Animalier de Casteil');
    expect(j.address.postalCode).toBe('66820');
    expect(j.geo.latitude).toBe(42.5);
    expect(j.sameAs).toEqual(['https://parc.fr']);
    expect(j.makesOffer[0].itemOffered.name).toBe('Visite');
  });
  it('n’expose ni adresse ni position pour un itinérant', () => {
    const j: any = jsonLdFiche({ ...base, itinerant: true, secteur: 'Tout le 66' }, { url: 'u' });
    expect(j.address).toBeUndefined();
    expect(j.geo).toBeUndefined();
    expect(j.areaServed).toBe('Tout le 66');
  });
});

describe('sitemapXml', () => {
  it('liste les URL absolues avec la date de mise à jour', () => {
    const x = sitemapXml('https://site.fr', [{ chemin: '/' }, { chemin: '/loisirs66/a&b', maj: '2026-11-05T10:00:00Z' }]);
    expect(x).toContain('<loc>https://site.fr/</loc>');
    expect(x).toContain('<loc>https://site.fr/loisirs66/a&amp;b</loc><lastmod>2026-11-05</lastmod>');
  });
});
