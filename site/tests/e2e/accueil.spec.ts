import { expect, test, type Page } from '@playwright/test';

// Ces tests lisent le vrai contenu Sanity : ils vérifient des comportements
// (un filtre réduit la liste, etc.) plutôt que des nombres exacts de fiches.

test.describe('accueil', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('affiche le bandeau, la recherche, les univers et les territoires', async ({ page }) => {
    await expect(page).toHaveTitle(/Loisirs 66/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Découvrez les loisirs du 66');
    await expect(page.getByRole('search').getByPlaceholder('Quelle activité vous tente ?')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Nos univers' })).toBeVisible();
    expect(await page.locator('#univers li a').count()).toBe(6);
    await expect(page.locator('#univers')).toContainText('Animaux & ferme');
    await expect(page.getByRole('heading', { name: 'Nos territoires' })).toBeVisible();
    expect(await page.locator('#territoires li a').count()).toBeGreaterThanOrEqual(2);
  });

  test('la recherche mène à /recherche avec le mot-clé', async ({ page }) => {
    await page.getByRole('search').getByPlaceholder('Quelle activité vous tente ?').fill('karting');
    await page.getByRole('button', { name: 'Rechercher' }).click();
    await expect(page).toHaveURL(/\/recherche\?q=karting$/);
    await expect(page.locator('#cards-grid .activity-card').first()).toBeVisible();
  });

  test('un univers mène à la liste filtrée', async ({ page }) => {
    await page.locator('#univers li a').first().click();
    await expect(page).toHaveURL(/\/recherche\?univers=/);
    await expect(page.locator('a.chip.active[data-filter="univers"]')).toHaveCount(1);
  });

  test('les raccourcis mènent à la recherche', async ({ page }) => {
    await page.getByRole('navigation', { name: 'Raccourcis' }).getByRole('link', { name: 'En intérieur' }).click();
    await expect(page).toHaveURL(/\/recherche\?cadre=en\+int%C3%A9rieur$/);
  });

  test('le menu mobile s’ouvre et se ferme', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'menu burger propre au mobile');
    await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
    const menu = page.getByRole('dialog', { name: 'Menu' });
    await expect(menu).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
  });
});

test.describe('recherche', () => {
  const cartes = (page: Page) => page.locator('#cards-grid .activity-card');
  const nombreAffiche = async (page: Page) => Number(((await page.locator('#count').textContent()) ?? '').match(/\d+/)?.[0]);

  test('sans critère, liste toutes les activités', async ({ page }) => {
    await page.goto('/recherche');
    const total = await cartes(page).count();
    expect(total).toBeGreaterThan(10);
    expect(await nombreAffiche(page)).toBe(total);
    await expect(page.locator('#btn-clear-filters')).toHaveCount(0);
  });

  test('un mot-clé réduit la liste', async ({ page }) => {
    await page.goto('/recherche');
    const total = await cartes(page).count();
    await page.goto('/recherche?q=karting');
    const n = await cartes(page).count();
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThan(total);
    expect(await nombreAffiche(page)).toBe(n);
  });

  test('une recherche sans résultat l’indique', async ({ page }) => {
    await page.goto('/recherche?q=zzzz-aucune-activite');
    await expect(page.locator('#count')).toHaveText('0 activité trouvée');
    await expect(page.getByText('Aucune activité ne correspond à ces critères.')).toBeVisible();
  });

  test('un filtre s’active puis se retire, « effacer » réinitialise', async ({ page }) => {
    await page.goto('/recherche');
    const total = await cartes(page).count();
    await page.locator('a.chip[data-filter="cadre"][data-value="en intérieur"]').click();
    await expect(page).toHaveURL(/cadre=en\+int%C3%A9rieur/);
    const n = await cartes(page).count();
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThan(total);

    await page.locator('a.chip.active[data-filter="cadre"]').click();
    await expect(page).toHaveURL(/\/recherche$/);
    await expect(cartes(page)).toHaveCount(total);

    await page.goto('/recherche?cadre=en+plein+air&q=parc');
    await page.locator('#btn-clear-filters').click();
    await expect(page).toHaveURL(/\/recherche$/);
  });

  test('une carte mène à la fiche, « Retour aux résultats » ramène à la recherche', async ({ page }) => {
    await page.goto('/recherche?cadre=en+int%C3%A9rieur');
    const lien = cartes(page).first().locator('a');
    const href = await lien.getAttribute('href');
    expect(href).toMatch(/^\/loisirs66\/[\w-]+$/);
    await lien.click();
    await expect(page).toHaveURL(href!);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.waitForLoadState('load');
    await page.locator('#retour-bas').click();
    await expect(page).toHaveURL(/\/recherche\?cadre=en\+int%C3%A9rieur$/);
  });

  test('les anciens liens type=indoor restent valides', async ({ page }) => {
    await page.goto('/recherche?type=indoor');
    await expect(page.locator('a.chip.active[data-filter="cadre"][data-value="en intérieur"]')).toHaveCount(1);
  });
});

test.describe('recherche (suite)', () => {
  test('propose d’autres univers après la liste, sans l’univers actif', async ({ page }) => {
    await page.goto('/recherche?univers=animaux-ferme');
    const bloc = page.getByRole('navigation', { name: 'Les autres univers' });
    await expect(bloc).toBeVisible();
    expect(await bloc.getByRole('link').count()).toBeGreaterThan(0);
    await expect(bloc.getByRole('link', { name: /Animaux & ferme/ })).toHaveCount(0);
  });

  test('propose d’autres envies après une liste filtrée par tag', async ({ page }) => {
    await page.goto('/recherche?cadre=en+int%C3%A9rieur');
    await expect(page.getByRole('navigation', { name: 'D’autres envies' })).toBeVisible();
  });

  test('la barre de recherche réapparaît en haut au défilement', async ({ page }) => {
    await page.goto('/recherche');
    const barre = page.locator('#barre-fixe');
    await expect(barre).toHaveClass(/-translate-y-full/);
    await page.locator('#cards-grid .activity-card').nth(6).scrollIntoViewIfNeeded();
    await expect(barre).not.toHaveClass(/-translate-y-full/);
  });

  test('un synonyme trouve les activités du tag correspondant', async ({ page }) => {
    await page.goto('/recherche?q=interieur');
    const n = await page.locator('#cards-grid .activity-card').count();
    expect(n).toBeGreaterThan(0);
  });

  test('le bandeau de l’accueil propose la saison en cours', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Raccourcis' }).getByRole('link', { name: /^À faire / })).toHaveCount(1);
  });
});

test.describe('fiche adhérent', () => {
  test('affiche nom, catégorie, lien vers le professionnel et suggestions', async ({ page }) => {
    await page.goto('/loisirs66/parc-animalier-de-casteil');
    await expect(page).toHaveTitle(/Casteil/i);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Casteil/i);
    await expect(page.getByRole('link', { name: /Découvrir le site du professionnel/ })).toHaveAttribute('href', /^https?:\/\//);
    await expect(page.getByRole('heading', { name: 'À découvrir aussi' })).toBeVisible();
    expect(await page.locator('#decouvrir-aussi [data-piste] > a').count()).toBeGreaterThan(0);
  });
});
