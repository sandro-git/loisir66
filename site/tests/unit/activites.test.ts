import { describe, expect, it } from 'vitest';
import { getFallbackImg, haversine } from '../../src/lib/activites';

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
    expect(id(getFallbackImg('KARTING DE TORREILLES', 'Outdoor'))).toBe('1571019613454-1cb2f99b2d8b');
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
