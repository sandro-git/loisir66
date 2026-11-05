import type { APIRoute } from 'astro';
import { sanityClient } from '../lib/sanity.js';
import { sitemapXml } from '../lib/seo';

export const GET: APIRoute = async ({ url }) => {
  const data: any = sanityClient
    ? await sanityClient
        .fetch(`{
          "fiches": *[_type == "adherent" && defined(slug.current)] | order(slug.current asc) { "slug": slug.current, _updatedAt },
          "pages": *[_type == "page" && defined(slug.current)] { "slug": slug.current, _updatedAt }
        }`)
        .catch(() => null)
    : null;
  const entrees = [
    { chemin: '/' },
    { chemin: '/recherche' },
    ...(data?.fiches ?? []).map((f: any) => ({ chemin: `/loisirs66/${f.slug}`, maj: f._updatedAt })),
    ...(data?.pages ?? []).map((p: any) => ({ chemin: `/${p.slug}`, maj: p._updatedAt })),
  ];
  return new Response(sitemapXml(url.origin, entrees), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
};
