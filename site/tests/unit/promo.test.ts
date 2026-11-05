import { describe, expect, it } from 'vitest';
import { EMAIL_VALIDE, aujourdhuiParis, construireEmail, normaliserCode, offreValable, type Campagne } from '../../src/lib/promo';

describe('normaliserCode', () => {
  it('ignore espaces et casse', () => {
    expect(normaliserCode('  Gites 2026 ')).toBe('gites2026');
    expect(normaliserCode('CE-AIRBUS')).toBe('ce-airbus');
  });
});

describe('dates', () => {
  it('donne la date du jour à Paris', () => {
    expect(aujourdhuiParis(new Date('2026-12-31T23:30:00Z'))).toBe('2027-01-01');
  });
  it('vérifie la validité d’une offre', () => {
    expect(offreValable({}, '2026-07-01')).toBe(true);
    expect(offreValable({ debut: '2026-06-01', fin: '2026-08-31' }, '2026-07-01')).toBe(true);
    expect(offreValable({ fin: '2026-06-30' }, '2026-07-01')).toBe(false);
    expect(offreValable({ debut: '2026-07-02' }, '2026-07-01')).toBe(false);
  });
});

describe('construireEmail', () => {
  const campagne: Campagne = {
    nom: 'Gîtes de France 2026',
    sujet: 'Vos offres Gîtes de France',
    message: 'Bonjour,\nvoici vos avantages.',
    fin: '2026-12-31',
    lienDocument: 'https://exemple.fr/offres.pdf',
    offres: [
      { adherent: { nom: 'VR Café', slug: 'vr-cafe', ville: 'Canet' }, tarifPromo: '12 €', tarifPublic: '15 €', conditions: 'Sur réservation' },
      { adherent: { nom: 'Offre expirée', slug: 'x' }, tarifPromo: '1 €', fin: '2026-01-01' },
      { adherent: { nom: '<script>alert(1)</script>' }, tarifPromo: '5 €' },
    ],
  };
  const e = construireEmail(campagne, { siteUrl: 'https://loisirsetactivite66.fr', aujourdhui: '2026-07-01' });

  it('reprend l’objet, le message et les offres valables', () => {
    expect(e.sujet).toBe('Vos offres Gîtes de France');
    expect(e.html).toContain('Bonjour,<br>voici vos avantages.');
    expect(e.html).toContain('https://loisirsetactivite66.fr/loisirs66/vr-cafe');
    expect(e.html).toContain('12 €');
    expect(e.html).toContain('https://exemple.fr/offres.pdf');
    expect(e.html).not.toContain('Offre expirée');
    expect(e.texte).toContain('• VR Café · Canet');
    expect(e.texte).toContain('12 € au lieu de 15 €');
  });
  it('échappe le contenu saisi', () => {
    expect(e.html).not.toContain('<script>');
    expect(e.html).toContain('&lt;script&gt;');
  });
});

describe('EMAIL_VALIDE', () => {
  it('accepte une adresse normale et refuse le reste', () => {
    expect(EMAIL_VALIDE.test('jean.dupont@exemple.fr')).toBe(true);
    expect(EMAIL_VALIDE.test('pas-un-email')).toBe(false);
    expect(EMAIL_VALIDE.test('a@b')).toBe(false);
  });
});
