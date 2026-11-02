import { expect, test, type Page } from '@playwright/test';

// Ces tests lisent le vrai contenu Sanity : ils vérifient des comportements
// (le filtre réduit la liste, etc.) plutôt que des nombres exacts de fiches.

const cartes = (page: Page) => page.locator('#cards-grid .activity-card');
const cartesVisibles = (page: Page) => page.locator('#cards-grid .activity-card:visible');
const compteur = (page: Page) => page.locator('#count');

async function nombreAffiche(page: Page): Promise<number> {
  const texte = (await compteur(page).textContent()) ?? '';
  return Number(texte.match(/\d+/)?.[0]);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  // le script client remplit le compteur au premier filtrage ; on attend que la grille soit là
  await expect(cartes(page).first()).toBeAttached();
});

test("la page d'accueil affiche le titre, la recherche et des activités", async ({ page }) => {
  await expect(page).toHaveTitle(/Loisirs 66/);
  await expect(page.getByRole('heading', { name: 'Trouvez une activité' })).toBeVisible();
  await expect(page.locator('#search-input')).toBeVisible();
  expect(await cartes(page).count()).toBeGreaterThan(10);
  await expect(page.locator('#univers-section')).toBeVisible();
});

test('la recherche filtre les cartes et met à jour le compteur', async ({ page }) => {
  const total = await cartes(page).count();

  await page.locator('#search-input').fill('karting');
  await expect(compteur(page)).toHaveText(/activités? trouvées?/);
  const visibles = await cartesVisibles(page).count();

  expect(visibles).toBeGreaterThan(0);
  expect(visibles).toBeLessThan(total);
  expect(await nombreAffiche(page)).toBe(visibles);
  for (const carte of await cartesVisibles(page).all()) {
    const texte = `${await carte.getAttribute('data-nom')} ${await carte.getAttribute('data-description')}`;
    expect(texte).toContain('karting');
  }
  // « Nos univers » est masqué pendant une recherche
  await expect(page.locator('#univers-section')).toBeHidden();
});

test('une recherche sans résultat affiche 0 activité', async ({ page }) => {
  await page.locator('#search-input').fill('zzzz-aucune-activite');
  await expect(compteur(page)).toHaveText('0 activité trouvée');
  await expect(cartesVisibles(page)).toHaveCount(0);
});

test('un filtre (chip) réduit la liste, un second clic le retire', async ({ page, isMobile }) => {
  test.skip(isMobile, 'les chips de la page sont masqués sur mobile (voir test dédié)');
  const total = await cartes(page).count();
  const chip = page.locator('main .chip[data-filter="type"][data-value="indoor"]');

  await chip.click();
  await expect(chip).toHaveClass(/active/);
  const visibles = await cartesVisibles(page).count();
  expect(visibles).toBeGreaterThan(0);
  expect(visibles).toBeLessThan(total);
  for (const carte of await cartesVisibles(page).all()) {
    await expect(carte).toHaveAttribute('data-type', 'indoor');
  }

  await chip.click();
  await expect(chip).not.toHaveClass(/active/);
  await expect(cartesVisibles(page)).toHaveCount(total);
});

test('le bouton « effacer » réinitialise recherche et filtres', async ({ page, isMobile }) => {
  test.skip(isMobile, 'les chips de la page sont masqués sur mobile (voir test dédié)');
  const total = await cartes(page).count();
  const effacer = page.locator('#btn-clear-filters');

  await expect(effacer).toBeHidden();
  await page.locator('main .chip[data-filter="type"][data-value="outdoor"]').click();
  await page.locator('#search-input').fill('parc');
  await expect(effacer).toBeVisible();

  await effacer.click();
  await expect(page.locator('#search-input')).toHaveValue('');
  await expect(page.locator('main .chip.active')).toHaveCount(0);
  await expect(cartesVisibles(page)).toHaveCount(total);
  await expect(effacer).toBeHidden();
});

test('un clic sur un univers filtre par branche', async ({ page }) => {
  const total = await cartes(page).count();
  const univers = page.locator('.univers-card').first();
  const branche = await univers.getAttribute('data-branche-filter');

  await univers.click();
  const visibles = await cartesVisibles(page).count();
  expect(visibles).toBeLessThan(total);
  for (const carte of await cartesVisibles(page).all()) {
    await expect(carte).toHaveAttribute('data-branche', branche!);
  }
});

test("une carte mène à la fiche de l'activité", async ({ page }) => {
  const carte = cartes(page).first();
  const href = await carte.getAttribute('href');
  expect(href).toMatch(/^\/loisirs66\/[\w-]+$/);

  await carte.click();
  await expect(page).toHaveURL(href!);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.getByRole('link', { name: /Retour aux activités/ }).click();
  await expect(page).toHaveURL(/\/$/);
});

test('sur mobile, les filtres sont dans la barre fixe qui apparaît au défilement', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'comportement propre au mobile');
  const barre = page.locator('#sticky-bar');
  const chip = barre.locator('.chip[data-filter="type"][data-value="indoor"]');

  await expect(page.locator('main .chip').first()).toBeHidden();
  await expect(barre).toHaveClass(/-translate-y-full/);

  await page.locator('#cards-grid').scrollIntoViewIfNeeded();
  await expect(barre).not.toHaveClass(/-translate-y-full/);

  const total = await cartes(page).count();
  await chip.click();
  await expect(chip).toHaveClass(/active/);
  const visibles = await cartesVisibles(page).count();
  expect(visibles).toBeGreaterThan(0);
  expect(visibles).toBeLessThan(total);
});
