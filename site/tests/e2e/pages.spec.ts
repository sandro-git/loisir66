import { expect, test } from '@playwright/test';

test('une fiche inconnue renvoie vers l’accueil', async ({ page }) => {
  await page.goto('/loisirs66/cette-fiche-n-existe-pas');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Trouvez une activité' })).toBeVisible();
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

test('aucune erreur JavaScript sur l’accueil', async ({ page }) => {
  const erreurs: string[] = [];
  page.on('pageerror', (e) => erreurs.push(e.message));
  await page.goto('/');
  await page.locator('#search-input').fill('parc');
  await page.locator('#search-input').fill('');
  expect(erreurs).toEqual([]);
});
