import type { APIRoute } from 'astro';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { sanityClient } from '../../../lib/sanity.js';

const ADMIN_EMAIL = 'sandro@vr-cafe.fr';

function randomPassword(): string {
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `Loisirs66!${digits}`;
}

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  // Vérification auth admin
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
  const form         = await request.formData();
  const sanityDocId  = (form.get('sanity_doc_id') as string)?.trim();
  const email        = (form.get('email') as string)?.trim();

  if (!sanityDocId || !email) return redirect('/admin?erreur=champs-manquants');

  // Récupère le nom depuis Sanity
  const doc: { nom: string } | null = sanityClient
    ? await sanityClient.fetch(`*[_type == "adherent" && _id == $id][0]{ nom }`, { id: sanityDocId }).catch(() => null)
    : null;

  if (!doc) return redirect('/admin?erreur=fiche-introuvable');

  // Création compte Supabase
  const supabaseAdmin = createSupabaseClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const tempPassword = randomPassword();
  const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });

  if (createError || !authData.user) return redirect('/admin?erreur=email-existant');

  // Lien dans la table adherents
  const { error: tableError } = await supabaseAdmin
    .from('adherents')
    .insert({ id: authData.user.id, email, sanity_doc_id: sanityDocId });

  if (tableError) return redirect('/admin?erreur=table');

  return redirect(`/admin?success=1&mdp=${encodeURIComponent(tempPassword)}&nom=${encodeURIComponent(doc.nom)}&email=${encodeURIComponent(email)}`);
};
