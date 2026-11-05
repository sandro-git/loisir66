import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { sanityWriter } from '../../lib/sanity-write.js';
import { patchProfil } from '../../lib/profil';

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

  const form = await request.formData();
  const { set, unset, erreurs } = patchProfil(form);
  if (erreurs.length) return redirect(`/mon-profil?erreur=${encodeURIComponent(erreurs.join(' '))}`);

  // Photo principale si fournie
  const imageFile = form.get('image') as File | null;
  if (imageFile && imageFile.size > 0) {
    if (!imageFile.type.startsWith('image/') || imageFile.size > 10 * 1024 * 1024) {
      return redirect(`/mon-profil?erreur=${encodeURIComponent('La photo doit être une image de 10 Mo maximum.')}`);
    }
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const asset = await sanityWriter.assets.upload('image', buffer, {
      filename: imageFile.name,
      contentType: imageFile.type,
    });
    set.image = { _type: 'image', asset: { _type: 'reference', _ref: asset._id } };
  }

  await sanityWriter.patch(adherentRow.sanity_doc_id.trim()).set(set).unset(unset).commit();

  return redirect('/mon-profil?success=1');
};
