import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const form = await request.formData();
  const email = form.get('email') as string;
  const password = form.get('password') as string;

  const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY
  );

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    return redirect('/connexion?erreur=1');
  }

  const cookieOpts = {
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const,
    path: '/',
  };

  cookies.set('sb-access-token', data.session.access_token, {
    ...cookieOpts,
    maxAge: 60 * 60 * 24 * 7,
  });
  cookies.set('sb-refresh-token', data.session.refresh_token, {
    ...cookieOpts,
    maxAge: 60 * 60 * 24 * 30,
  });

  return redirect('/mon-profil');
};
