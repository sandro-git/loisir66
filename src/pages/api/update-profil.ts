import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { sanityWriter } from '../../lib/sanity-write.js';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  // Vérification auth
  const accessToken = cookies.get('sb-access-token')?.value;
  if (!accessToken) return redirect('/connexion');

  const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return redirect('/connexion');

  // Récupère le sanity_doc_id de cet utilisateur
  const { data: adherentRow } = await supabase
    .from('adherents')
    .select('sanity_doc_id')
    .eq('id', user.id)
    .single();

  if (!adherentRow?.sanity_doc_id) {
    return redirect('/mon-profil?erreur=no-doc');
  }

  // Lecture du formulaire
  const form = await request.formData();

  const publics = form.getAll('publics') as string[];

  const patch: Record<string, any> = {
    nom:        form.get('nom'),
    soustitre:  form.get('soustitre'),
    type:       form.get('type'),
    publics,
    saison:     form.get('saison'),
    description: form.get('description'),
    ville:      form.get('ville'),
    adresse:    form.get('adresse'),
    horaires:   form.get('horaires'),
    tarifs:     form.get('tarifs'),
    siteWeb:    form.get('siteWeb') || undefined,
  };

  // Supprime les champs vides pour ne pas écraser avec null
  Object.keys(patch).forEach(k => {
    if (patch[k] === '' || patch[k] === null) delete patch[k];
  });

  await sanityWriter.patch(adherentRow.sanity_doc_id.trim()).set(patch).commit();

  return redirect('/mon-profil?success=1');
};
