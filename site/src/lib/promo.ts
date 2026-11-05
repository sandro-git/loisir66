// Codes promo / campagnes (cahier des charges §10) : logique pure, testée dans tests/unit/promo.test.ts.

export type Offre = {
  tarifPublic?: string | null;
  tarifPromo?: string | null;
  conditions?: string | null;
  debut?: string | null;
  fin?: string | null;
  adherent?: { nom?: string | null; slug?: string | null; ville?: string | null; siteWeb?: string | null } | null;
};

export type Campagne = {
  nom: string;
  etat?: string | null;
  debut?: string | null;
  fin?: string | null;
  sujet?: string | null;
  message?: string | null;
  lienDocument?: string | null;
  offres?: Offre[] | null;
};

/** Code saisi → forme comparable (sans espaces, minuscules). */
export function normaliserCode(code: string): string {
  return code.normalize('NFKC').replace(/\s+/g, '').toLowerCase();
}

/** Requête (jeton serveur requis : les campagnes sont des documents privés « campagnes.* »). */
export const CAMPAGNE_PAR_CODE_QUERY = `*[_type == "campagne" && etat == "active"
  && count(codes[lower(@) == $code]) > 0
  && (!defined(debut) || debut <= $aujourdhui) && (!defined(fin) || fin >= $aujourdhui)
] | order(_updatedAt desc)[0]{
  nom, etat, debut, fin, sujet, message, lienDocument,
  "offres": offres[]{ tarifPublic, tarifPromo, conditions, debut, fin,
    "adherent": adherent->{ nom, "slug": slug.current, ville, siteWeb } }
}`;

/** Campagnes où figure un adhérent (espace adhérent « Mes campagnes »), réduites à SES offres. */
export const MES_CAMPAGNES_QUERY = `*[_type == "campagne" && etat in ["active", "terminee"] && $id in offres[].adherent._ref]
  | order(coalesce(debut, _createdAt) desc){
  nom, etat, debut, fin, codes,
  "offres": offres[adherent._ref == $id]{ tarifPublic, tarifPromo, conditions, debut, fin }
}`;

/** Date du jour à Paris au format AAAA-MM-JJ. */
export function aujourdhuiParis(d = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(d);
}

/** Une offre est encore valable aujourd'hui (dates de l'offre, facultatives). */
export function offreValable(o: Offre, aujourdhui: string): boolean {
  return (!o.debut || o.debut <= aujourdhui) && (!o.fin || o.fin >= aujourdhui);
}

const echapper = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const dateFr = (iso?: string | null) => (iso ? iso.split('-').reverse().join('/') : '');

function periode(debut?: string | null, fin?: string | null): string {
  if (debut && fin) return `du ${dateFr(debut)} au ${dateFr(fin)}`;
  if (fin) return `jusqu’au ${dateFr(fin)}`;
  if (debut) return `à partir du ${dateFr(debut)}`;
  return '';
}

/** Contenu de l'e-mail envoyé au visiteur (HTML simple compatible messageries + version texte). */
export function construireEmail(c: Campagne, opts: { siteUrl: string; aujourdhui: string }): { sujet: string; html: string; texte: string } {
  const offres = (c.offres ?? []).filter((o) => o.adherent?.nom && offreValable(o, opts.aujourdhui));
  const sujet = c.sujet || 'Vos offres loisirs dans le 66';
  const intro = c.message?.trim() || `Voici les offres de la campagne « ${c.nom} ».`;
  const lienFiche = (o: Offre) => (o.adherent?.slug ? `${opts.siteUrl}/loisirs66/${o.adherent.slug}` : o.adherent?.siteWeb ?? '');

  const lignesHtml = offres
    .map((o) => {
      const tarif = [o.tarifPromo && `<strong>${echapper(o.tarifPromo)}</strong>`, o.tarifPublic && `<span style="color:#6b6e75;text-decoration:line-through">${echapper(o.tarifPublic)}</span>`]
        .filter(Boolean).join(' ');
      const details = [o.conditions && echapper(o.conditions).replace(/\n/g, '<br>'), periode(o.debut, o.fin) && `Valable ${periode(o.debut, o.fin)}`]
        .filter(Boolean).join('<br>');
      const lien = lienFiche(o);
      return `<tr><td style="padding:14px 0;border-bottom:1px solid #e7e5e1">
  <div style="font-weight:600;font-size:16px">${lien ? `<a href="${echapper(lien)}" style="color:#26272b">${echapper(o.adherent!.nom!)}</a>` : echapper(o.adherent!.nom!)}${o.adherent?.ville ? ` <span style="color:#6b6e75;font-weight:400">· ${echapper(o.adherent.ville)}</span>` : ''}</div>
  ${tarif ? `<div style="margin-top:4px">${tarif}</div>` : ''}
  ${details ? `<div style="margin-top:4px;color:#6b6e75;font-size:14px">${details}</div>` : ''}
</td></tr>`;
    })
    .join('\n');

  const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#f8f6f2;font-family:Arial,Helvetica,sans-serif;color:#26272b">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#368db3;color:#ffffff;padding:20px 24px;font-size:18px;font-weight:bold">APLPO – Activités et Loisirs 66</td></tr>
<tr><td style="padding:24px">
  <h1 style="margin:0 0 12px;font-size:22px">${echapper(c.nom)}</h1>
  ${periode(c.debut, c.fin) ? `<p style="margin:0 0 16px;color:#6b6e75">Campagne valable ${periode(c.debut, c.fin)}.</p>` : ''}
  <p style="margin:0 0 16px;line-height:1.6">${echapper(intro).replace(/\n/g, '<br>')}</p>
  ${c.lienDocument ? `<p style="margin:0 0 20px"><a href="${echapper(c.lienDocument)}" style="display:inline-block;background:#e07360;color:#26272b;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:bold">Voir le document des offres</a></p>` : ''}
  ${offres.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${lignesHtml}</table>` : ''}
  <p style="margin:24px 0 0;font-size:13px;color:#6b6e75">Présentez ce message ou votre code auprès du professionnel. Vous recevez cet e-mail car vous avez saisi un code promo sur <a href="${opts.siteUrl}" style="color:#2a7598">${opts.siteUrl.replace(/^https?:\/\//, '')}</a>.</p>
</td></tr></table></td></tr></table></body></html>`;

  const texte = [
    `APLPO – Activités et Loisirs 66`,
    ``,
    c.nom + (periode(c.debut, c.fin) ? ` (valable ${periode(c.debut, c.fin)})` : ''),
    ``,
    intro,
    c.lienDocument ? `\nDocument des offres : ${c.lienDocument}` : '',
    ``,
    ...offres.map((o) =>
      [
        `• ${o.adherent!.nom}${o.adherent?.ville ? ` · ${o.adherent.ville}` : ''}`,
        [o.tarifPromo, o.tarifPublic && `au lieu de ${o.tarifPublic}`].filter(Boolean).join(' '),
        o.conditions ?? '',
        periode(o.debut, o.fin) && `Valable ${periode(o.debut, o.fin)}`,
        lienFiche(o),
      ].filter(Boolean).join('\n  '),
    ),
    ``,
    `Présentez ce message ou votre code auprès du professionnel.`,
  ].join('\n');

  return { sujet, html, texte };
}

export const EMAIL_VALIDE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
