import { expect, test } from '@playwright/test';

test('une fiche inconnue renvoie vers l’accueil', async ({ page }) => {
  await page.goto('/loisirs66/cette-fiche-n-existe-pas');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Découvrez les loisirs du 66');
});

test('la page /activites a été supprimée (404)', async ({ request }) => {
  const res = await request.get('/activites', { maxRedirects: 0 });
  expect(res.status()).toBe(404);
});

test('la page de connexion affiche le formulaire', async ({ page }) => {
  await page.goto('/connexion');
  await expect(page.getByRole('heading', { name: 'Espace adhérent' })).toBeVisible();
  await expect(page.locator('form[action="/api/login"] input[name="email"]')).toBeVisible();
  await expect(page.locator('form[action="/api/login"] input[name="password"]')).toBeVisible();
  await expect(page.getByText('Email ou mot de passe incorrect.')).toHaveCount(0);
});

test('la page de connexion affiche l’erreur après un échec', async ({ page }) => {
  await page.goto('/connexion?erreur=1');
  await expect(page.getByText('Email ou mot de passe incorrect.')).toBeVisible();
});

for (const protegee of ['/mon-profil', '/admin']) {
  test(`${protegee} redirige vers la connexion sans être connecté`, async ({ page }) => {
    await page.goto(protegee);
    await expect(page).toHaveURL(/\/connexion$/);
  });
}

for (const url of ['/', '/recherche', '/loisirs66/parc-animalier-de-casteil']) {
  test(`aucune erreur JavaScript sur ${url}`, async ({ page }) => {
    const erreurs: string[] = [];
    page.on('pageerror', (e) => erreurs.push(e.message));
    await page.goto(url);
    await page.mouse.wheel(0, 3000);
    await page.waitForTimeout(300);
    expect(erreurs).toEqual([]);
  });
}

test.describe('formulaire codes promo (/api/promo)', () => {
  const envoyer = (request: any, champs: Record<string, string>) => request.post('/api/promo', { multipart: champs });

  test('refuse une saisie incomplète', async ({ request }) => {
    const r = await envoyer(request, { code: 'TEST', email: 'pas-un-email', consentement: 'oui' });
    expect(r.status()).toBe(400);
    expect((await r.json()).message).toMatch(/e-mail invalide/i);
    const r2 = await envoyer(request, { code: 'TEST', email: 'a@exemple.fr' });
    expect(r2.status()).toBe(400);
  });

  test('ignore silencieusement les robots (pot de miel)', async ({ request }) => {
    const r = await envoyer(request, { code: 'X', email: 'a@exemple.fr', consentement: 'oui', 'bot-field': 'spam' });
    expect(r.status()).toBe(200);
  });

  test('un code inconnu est refusé (ou service non configuré)', async ({ request }) => {
    const r = await envoyer(request, { code: 'CODE-INEXISTANT-E2E', email: 'a@exemple.fr', consentement: 'oui' });
    expect([404, 503]).toContain(r.status());
    expect((await r.json()).ok).toBe(false);
  });

  test('le formulaire du pied de page affiche la réponse', async ({ page }) => {
    await page.goto('/');
    await page.fill('#promo-code', 'CODE-INEXISTANT-E2E');
    await page.fill('#promo-email', 'a@exemple.fr');
    await page.check('input[name="consentement"]');
    await page.getByRole('button', { name: /Recevoir mes offres/ }).click();
    await expect(page.locator('#promos-message')).toBeVisible();
  });
});

test.describe('référencement', () => {
  test('robots.txt et sitemap.xml', async ({ request, baseURL }) => {
    const robots = await (await request.get('/robots.txt')).text();
    if (/--.*\.netlify\.app/.test(baseURL ?? '')) expect(robots).toContain('Disallow: /');
    else expect(robots).toContain('Sitemap:');
    const sitemap = await request.get('/sitemap.xml');
    expect(sitemap.headers()['content-type']).toContain('xml');
    expect(await sitemap.text()).toMatch(/<loc>[^<]+\/loisirs66\/[\w-]+<\/loc>/);
  });

  test('fiche : canonique, Open Graph et données structurées', async ({ page }) => {
    await page.goto('/loisirs66/parc-animalier-de-casteil');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/loisirs66\/parc-animalier-de-casteil$/);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /Casteil/i);
    const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}');
    expect(ld['@type']).toContain('TouristAttraction');
  });

  test('les résultats filtrés ne sont pas indexés, la liste complète oui', async ({ page }) => {
    await page.goto('/recherche?cadre=en+int%C3%A9rieur');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await page.goto('/recherche');
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  });

  test('une page de contenu inexistante renvoie 404', async ({ request }) => {
    expect((await request.get('/page-qui-n-existe-pas')).status()).toBe(404);
  });
});

test.describe('mot de passe oublié (Supabase requis : testé sur la preview)', () => {
  test.skip(!process.env.BASE_URL, 'les clés Supabase ne sont pas configurées en local');

  test('la connexion propose « Mot de passe oublié ? »', async ({ page }) => {
    await page.goto('/connexion');
    await page.getByRole('link', { name: 'Mot de passe oublié ?' }).click();
    await expect(page).toHaveURL(/\/mot-de-passe-oublie$/);
  });

  test('sans lien valable, la page de nouveau mot de passe le dit', async ({ page }) => {
    await page.goto('/nouveau-mot-de-passe');
    await expect(page.getByText('Ce lien n’est plus valable')).toBeVisible();
  });

  test('un lien de récupération arrivé sur l’accueil est redirigé', async ({ page }) => {
    await page.goto('/#access_token=faux&type=recovery');
    await expect(page).toHaveURL(/\/nouveau-mot-de-passe/);
  });
});
