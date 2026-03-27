import type { APIRoute } from 'astro';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { sanityWriter } from '../../../lib/sanity-write.js';

const ADMIN_EMAIL = 'sandro@vr-cafe.fr';

function slugify(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function randomPassword(): string {
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `Loisirs66!${digits}`;
}

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  // Vérification auth
  const accessToken = cookies.get('sb-access-token')?.value;
  if (!accessToken) return redirect('/connexion');

  const supabase = createSupabaseClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user || user.email !== ADMIN_EMAIL) return redirect('/connexion');

  // Lecture du formulaire
  const form = await request.formData();
  const nom   = (form.get('nom') as string)?.trim();
  const email = (form.get('email') as string)?.trim();

  if (!nom || !email) return redirect('/admin?erreur=champs-manquants');

  // Client admin Supabase
  const supabaseAdmin = createSupabaseClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Création fiche Sanity
  const slug = slugify(nom);
  let sanityDocId: string;
  try {
    const doc = await sanityWriter.create({
      _type: 'adherent',
      nom,
      slug: { _type: 'slug', current: slug },
    });
    sanityDocId = doc._id;
  } catch {
    return redirect('/admin?erreur=sanity');
  }

  // Création compte Supabase
  const tempPassword = randomPassword();
  const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });

  if (createError || !authData.user) {
    // Supprime la fiche Sanity si l'auth échoue
    await sanityWriter.delete(sanityDocId);
    return redirect(`/admin?erreur=email-existant`);
  }

  // Lien dans la table adherents
  const { error: tableError } = await supabaseAdmin
    .from('adherents')
    .insert({ id: authData.user.id, email, sanity_doc_id: sanityDocId });

  if (tableError) {
    return redirect('/admin?erreur=table');
  }

  return redirect(`/admin?success=1&mdp=${encodeURIComponent(tempPassword)}&nom=${encodeURIComponent(nom)}&email=${encodeURIComponent(email)}`);
};
