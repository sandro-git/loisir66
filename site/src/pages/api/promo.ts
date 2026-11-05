import type { APIRoute } from 'astro';
import { createClient } from '@sanity/client';
import { CAMPAGNE_PAR_CODE_QUERY, EMAIL_VALIDE, aujourdhuiParis, construireEmail, normaliserCode } from '../../lib/promo';

export const prerender = false;

// Formulaire « Recevoir mes promos par e-mail » : code valide + e-mail → envoi automatique (Brevo).
// Variables d'environnement (Netlify) : SANITY_READ_TOKEN (lecture des campagnes privées),
// BREVO_API_KEY, PROMO_EXPEDITEUR_EMAIL (expéditeur validé dans Brevo), PROMO_EXPEDITEUR_NOM (facultatif).

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });

export const POST: APIRoute = async ({ request, url }) => {
  let donnees: FormData;
  try { donnees = await request.formData(); } catch { return json(400, { ok: false, message: 'Requête invalide.' }); }

  // Pot de miel anti-robots : on répond « ok » sans rien faire.
  if (String(donnees.get('bot-field') ?? '')) return json(200, { ok: true });

  const code = normaliserCode(String(donnees.get('code') ?? ''));
  const email = String(donnees.get('email') ?? '').trim();
  if (!code || code.length > 64) return json(400, { ok: false, message: 'Merci de saisir votre code promo.' });
  if (!EMAIL_VALIDE.test(email) || email.length > 254) return json(400, { ok: false, message: 'Adresse e-mail invalide.' });
  if (donnees.get('consentement') !== 'oui') return json(400, { ok: false, message: 'Merci d’accepter l’utilisation de votre e-mail.' });

  const env = import.meta.env;
  const token = env.SANITY_READ_TOKEN;
  const cleBrevo = env.BREVO_API_KEY;
  const expediteur = env.PROMO_EXPEDITEUR_EMAIL;
  if (!token || !cleBrevo || !expediteur || !env.PUBLIC_SANITY_PROJECT_ID) {
    console.error('[promo] configuration manquante (SANITY_READ_TOKEN / BREVO_API_KEY / PROMO_EXPEDITEUR_EMAIL)');
    return json(503, { ok: false, message: 'Le service est momentanément indisponible. Merci de réessayer plus tard.' });
  }

  const sanity = createClient({
    projectId: env.PUBLIC_SANITY_PROJECT_ID,
    dataset: env.PUBLIC_SANITY_DATASET ?? 'production',
    apiVersion: env.PUBLIC_SANITY_API_VERSION ?? '2024-01-01',
    useCdn: false,
    token,
    perspective: 'published',
  });

  const aujourdhui = aujourdhuiParis();
  let campagne: any;
  try {
    campagne = await sanity.fetch(CAMPAGNE_PAR_CODE_QUERY, { code, aujourdhui });
  } catch (e) {
    console.error('[promo] lecture Sanity impossible', e);
    return json(503, { ok: false, message: 'Le service est momentanément indisponible. Merci de réessayer plus tard.' });
  }
  if (!campagne) return json(404, { ok: false, message: 'Ce code n’est pas reconnu ou la campagne est terminée.' });

  const { sujet, html, texte } = construireEmail(campagne, { siteUrl: url.origin, aujourdhui });
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': cleBrevo, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      sender: { email: expediteur, name: env.PROMO_EXPEDITEUR_NOM || 'APLPO – Loisirs 66' },
      to: [{ email }],
      subject: sujet,
      htmlContent: html,
      textContent: texte,
      tags: ['code-promo'],
    }),
  }).catch((e) => { console.error('[promo] Brevo injoignable', e); return null; });

  if (!res?.ok) {
    console.error('[promo] envoi Brevo refusé', res?.status, await res?.text().catch(() => ''));
    return json(502, { ok: false, message: 'L’envoi a échoué, merci de réessayer.' });
  }
  return json(200, { ok: true, message: 'Merci ! Vos offres arrivent dans votre boîte mail.' });
};
