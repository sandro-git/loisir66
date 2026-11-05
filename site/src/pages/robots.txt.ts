import type { APIRoute } from 'astro';

// Les Deploy Previews Netlify ne doivent pas être indexées ; la production l'est.
export const GET: APIRoute = ({ url }) => {
  const apercu = url.hostname.includes('--') && url.hostname.endsWith('.netlify.app');
  const corps = apercu
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nDisallow: /admin\nDisallow: /mon-profil\nDisallow: /api/\nDisallow: /connexion\n\nSitemap: ${url.origin}/sitemap.xml\n`;
  return new Response(corps, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
