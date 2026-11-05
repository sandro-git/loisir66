// Données structurées Schema.org et plan du site (cahier des charges §11). Testé dans tests/unit/seo.test.ts.
import { lignesAdresse, nomLisible } from './contenu';

/** Découpe « Rue du Cady / 66820 Casteil » en adresse postale Schema.org. */
export function adressePostale(adresse?: string | null, ville?: string | null) {
  const lignes = lignesAdresse(adresse);
  const cp = lignes.map((l) => l.match(/\b(\d{5})\b\s*(.*)/)).find(Boolean);
  const rue = lignes.filter((l) => !/\b\d{5}\b/.test(l)).join(', ');
  if (!rue && !cp && !ville) return null;
  return {
    '@type': 'PostalAddress',
    ...(rue && { streetAddress: rue }),
    ...(cp && { postalCode: cp[1] }),
    addressLocality: (cp?.[2]?.trim() || (ville ? nomLisible(ville) : undefined)) ?? undefined,
    addressRegion: 'Pyrénées-Orientales',
    addressCountry: 'FR',
  };
}

/** Fiche adhérent → TouristAttraction + LocalBusiness (itinérant : zone desservie, pas d'adresse). */
export function jsonLdFiche(a: any, opts: { url: string; image?: string | null }) {
  const itinerant = !!a.itinerant;
  const adresse = itinerant ? null : adressePostale(a.adresse, a.ville);
  return {
    '@context': 'https://schema.org',
    '@type': ['TouristAttraction', 'LocalBusiness'],
    name: nomLisible(a.nom ?? ''),
    url: opts.url,
    ...(a.accroche || a.description ? { description: a.accroche ? `${a.accroche}${a.description ? ` — ${a.description}` : ''}` : a.description } : {}),
    ...(opts.image && { image: opts.image }),
    ...(a.siteWeb && { sameAs: [a.siteWeb] }),
    ...(adresse && { address: adresse }),
    ...(!itinerant && a.localisation?.lat != null && { geo: { '@type': 'GeoCoordinates', latitude: a.localisation.lat, longitude: a.localisation.lng } }),
    ...(itinerant && { areaServed: a.secteur || 'Pyrénées-Orientales' }),
    ...(a.activites?.length && { makesOffer: a.activites.map((x: string) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: x } })) }),
    ...(a.branche?.titre && { keywords: [a.branche.titre.trim(), ...(a.activites ?? [])].join(', ') }),
  };
}

/** Accueil : l'association et le moteur de recherche du site. */
export function jsonLdAccueil(origin: string, contact: { email?: string; telephone?: string; reseaux?: string[] }) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'APLPO – Activités et Loisirs 66',
      url: origin,
      logo: `${origin}/logo-aplpo.avif`,
      ...(contact.email && { email: contact.email }),
      ...(contact.telephone && { telephone: contact.telephone }),
      ...(contact.reseaux?.length && { sameAs: contact.reseaux }),
      areaServed: 'Pyrénées-Orientales',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Loisirs 66',
      url: origin,
      potentialAction: { '@type': 'SearchAction', target: `${origin}/recherche?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
    },
  ];
}

const xml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** sitemap.xml : accueil, liste complète, fiches et pages (pas les combinaisons de filtres). */
export function sitemapXml(origin: string, entrees: { chemin: string; maj?: string | null }[]): string {
  const urls = entrees
    .map((e) => `  <url><loc>${xml(origin + e.chemin)}</loc>${e.maj ? `<lastmod>${e.maj.slice(0, 10)}</lastmod>` : ''}</url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
