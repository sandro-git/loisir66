/**
 * Import des membres Wix → Sanity (fiches) + Supabase (comptes auth)
 * Usage : bun --env-file=.env scripts/import-membres.ts
 */

import { createClient as createSanityClient } from '@sanity/client';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { parse } from 'csv-parse/sync';

// ─── Config ─────────────────────────────────────────────────────────────────

const CSV_PATH = resolve('/Users/sandro/Documents/_INBOX/Export Wix - Membres Loisirs66.csv');
const OUTPUT_CSV = resolve('scripts/membres-comptes.csv');

const sanity = createSanityClient({
  projectId: process.env.PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: process.env.PUBLIC_SANITY_API_VERSION ?? '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
});

const supabaseAdmin = createSupabaseClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugify(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function inferType(categorie: string): 'Indoor' | 'Outdoor' {
  const c = categorie.toLowerCase();
  if (c.includes('indoor') || c.includes('bains') || c.includes('thalasso')) {
    return 'Indoor';
  }
  return 'Outdoor';
}

function isValidEmail(email: string): boolean {
  return !!email && email !== "'-" && email.includes('@') && email.includes('.');
}

function randomPassword(): string {
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `Loisirs66!${digits}`;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('📂 Lecture du CSV…');
  const raw = readFileSync(CSV_PATH);
  const rows: Record<string, string>[] = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    relax_quotes: true,
    trim: true,
  });
  console.log(`✅ ${rows.length} membres trouvés\n`);

  // Récupère les slugs Sanity existants pour éviter les doublons
  const existing: string[] = await sanity.fetch(`*[_type == "adherent"].slug.current`);
  const existingSlugs = new Set(existing);
  console.log(`ℹ️  ${existingSlugs.size} fiche(s) déjà existante(s) dans Sanity\n`);

  // Récupère les emails Supabase existants pour éviter les doublons
  const { data: existingUsersData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  const existingEmails = new Set(existingUsersData?.users.map(u => u.email?.toLowerCase()) ?? []);

  const comptes: { nom: string; email: string; motDePasse: string }[] = [];
  let sanityCreated = 0;
  let supabaseCreated = 0;
  let skipped = 0;

  for (const row of rows) {
    const nom = row['Nom commercial']?.trim();
    if (!nom) continue;

    const slug = slugify(nom);
    const categorie = row['Catégories']?.trim() || '';
    const description = row['Description']?.trim() || '';
    const rawSiteWeb = row['Site web']?.trim() || '';
    const siteWeb = rawSiteWeb && rawSiteWeb !== "'-" ? rawSiteWeb : '';
    const email = row['E-mail membre 1']?.trim() || '';

    // ── 1. Sanity ────────────────────────────────────────────────────────────
    let sanityDocId: string;

    if (existingSlugs.has(slug)) {
      console.log(`⏭  Sanity — déjà existant : ${nom}`);
      sanityDocId = await sanity.fetch(
        `*[_type == "adherent" && slug.current == $slug][0]._id`,
        { slug }
      );
      skipped++;
    } else {
      const doc: Record<string, any> = {
        _type: 'adherent',
        nom,
        slug: { _type: 'slug', current: slug },
      };
      if (categorie) {
        doc.soustitre = categorie;
        doc.type = inferType(categorie);
      }
      if (description) doc.description = description;
      if (siteWeb) doc.siteWeb = siteWeb;

      const created = await sanity.create(doc);
      sanityDocId = created._id;
      sanityCreated++;
      console.log(`✅ Sanity — fiche créée : ${nom}`);
    }

    // ── 2. Supabase ──────────────────────────────────────────────────────────
    if (!isValidEmail(email)) {
      console.log(`   ⚠️  Pas d'email valide pour ${nom}`);
      continue;
    }

    if (existingEmails.has(email.toLowerCase())) {
      console.log(`   ⏭  Supabase — compte déjà existant : ${email}`);
      continue;
    }

    const tempPassword = randomPassword();
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      console.error(`   ❌ Supabase auth — erreur pour ${email}:`, authError?.message);
      continue;
    }

    const userId = authData.user.id;

    // Insère dans la table adherents (id + email + sanity_doc_id)
    const { error: tableError } = await supabaseAdmin
      .from('adherents')
      .insert({ id: userId, email, sanity_doc_id: sanityDocId });

    if (tableError) {
      console.error(`   ❌ Supabase table — erreur pour ${nom}:`, tableError.message);
    } else {
      supabaseCreated++;
      existingEmails.add(email.toLowerCase());
      comptes.push({ nom, email, motDePasse: tempPassword });
      console.log(`   ✅ Supabase — compte créé : ${email}`);
    }
  }

  // ── Résumé ──────────────────────────────────────────────────────────────────
  console.log('\n─────────────────────────────────────────');
  console.log('📊 Résumé :');
  console.log(`   Fiches Sanity créées    : ${sanityCreated}`);
  console.log(`   Fiches déjà existantes  : ${skipped}`);
  console.log(`   Comptes Supabase créés  : ${supabaseCreated}`);
  console.log('─────────────────────────────────────────\n');

  // ── Export CSV des comptes ──────────────────────────────────────────────────
  if (comptes.length > 0) {
    const csvContent = [
      'Nom,Email,Mot de passe temporaire',
      ...comptes.map(c => `"${c.nom}","${c.email}","${c.motDePasse}"`),
    ].join('\n');
    writeFileSync(OUTPUT_CSV, csvContent, 'utf-8');
    console.log(`📄 Fichier des comptes généré : ${OUTPUT_CSV}`);
    console.log('   ⚠️  À transmettre aux membres de façon sécurisée, puis supprimer.\n');
  }
}

main().catch(err => {
  console.error('❌ Erreur fatale :', err);
  process.exit(1);
});
