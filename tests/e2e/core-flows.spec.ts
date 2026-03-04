import { test, expect, type Page } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

const TEST_PATIENT = process.env.E2E_PATIENT ?? 'Sonnenschein';

async function dismissCookieBanner(page: Page) {
  const banner = page.getByRole('dialog', { name: /Cookie/i });
  if (await banner.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await page.getByRole('button', { name: /Nur notwendige/i }).click();
    await banner.waitFor({ state: 'hidden' }).catch(() => {});
  }
}

async function getPatientIdFromTable(page: Page): Promise<string> {
  await page.goto('/patients');
  await dismissCookieBanner(page);

  const patientLink = page
    .locator('tbody tr td a')
    .filter({ hasText: TEST_PATIENT })
    .first();

  await expect(patientLink).toBeVisible({ timeout: 10_000 });
  const href = await patientLink.getAttribute('href');
  if (!href) throw new Error(`No href found for patient link: ${TEST_PATIENT}`);

  const id = href.split('/').pop();
  if (!id) throw new Error(`Could not parse patient id from href: ${href}`);
  return id;
}

test.describe('Login', () => {
  test('eingeloggter User landet auf Dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await dismissCookieBanner(page);
    await page.waitForURL('**/dashboard', { timeout: 10_000 });
    await expect(page.getByRole('link', { name: /Bewohner/i }).first()).toBeVisible();
  });

  test('geschuetzte Route leitet nicht eingeloggten User zum Login', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();

    await page.goto('/dashboard');
    await page.waitForURL('**/login**', { timeout: 10_000 });
    expect(page.url()).toContain('login');

    await context.close();
  });

  test('zeigt Fehlermeldung bei falschen Credentials', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();

    await page.goto('/login');
    await dismissCookieBanner(page);

    await page.fill('#email', 'falsch@test.de');
    await page.fill('#password', 'falschesPasswort');
    await page.click('button:has-text("Anmelden")');

    await expect(page.getByText(/Ungueltige Anmeldedaten|E-Mail oder Passwort|Ungültige Anmeldedaten/i)).toBeVisible({
      timeout: 8_000,
    });

    await context.close();
  });
});

test.describe('Patienten', () => {
  test('Patienten-Uebersicht laedt mit Tabelle', async ({ page }) => {
    await page.goto('/patients');
    await dismissCookieBanner(page);
    await expect(page.getByRole('heading', { name: /Bewohner/i }).first()).toBeVisible();
    await expect(
      page
        .locator('tbody tr td a')
        .filter({ hasText: TEST_PATIENT })
        .first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Suchfeld filtert Patienten', async ({ page }) => {
    await page.goto('/patients');
    await dismissCookieBanner(page);

    const searchInput = page.locator('input[placeholder*="Pseudonym"]');
    await expect(searchInput).toBeVisible();

    await searchInput.fill('XYZNOTEXISTENT');
    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(0, { timeout: 5_000 });

    await searchInput.clear();
    await expect(
      page
        .locator('tbody tr td a')
        .filter({ hasText: TEST_PATIENT })
        .first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test('Patienten-Detailseite zeigt Tabs und Plan-Button', async ({ page }) => {
    const patientId = await getPatientIdFromTable(page);

    await page.goto(`/patients/${patientId}`);
    await dismissCookieBanner(page);

    await page.waitForURL(`**/patients/${patientId}`, { timeout: 10_000 });
    await expect(page.locator('main').getByText(TEST_PATIENT).first()).toBeVisible({ timeout: 8_000 });
    await expect(page.getByRole('button', { name: /Plan generieren/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /bersicht|Übersicht/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Absprachen/i })).toBeVisible();
  });
});

test.describe('Plan-Generierung', () => {
  test('Plan-Modal oeffnet sich mit korrekten Feldern', async ({ page }) => {
    const patientId = await getPatientIdFromTable(page);

    const row = page.locator('tr', {
      has: page.locator(`a[href="/patients/${patientId}"]`).first(),
    });
    await row.getByRole('button', { name: /Plan/i }).first().click();

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('heading', { name: /Plan generieren/i })).toBeVisible();
    await expect(page.locator('#numDays')).toBeVisible();
    await expect(page.locator('#weekStart')).toBeVisible();
    await expect(page.locator('#additionalNotes')).toBeVisible();
  });

  test('generiert 3-Tage-Plan und oeffnet Detailseite', async ({ page }) => {
    test.setTimeout(180_000);

    const patientId = await getPatientIdFromTable(page);

    const row = page.locator('tr', {
      has: page.locator(`a[href="/patients/${patientId}"]`).first(),
    });
    await row.getByRole('button', { name: /Plan/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.fill('#numDays', '3');
    await page.fill('#additionalNotes', 'Einfache Rezepte, schnell zuzubereiten');

    await page.getByRole('button', { name: /Plan generieren/i }).last().click();

    await page
      .getByText(/Tag.*wird erstellt|Finalisiere/i)
      .first()
      .waitFor({ state: 'visible', timeout: 20_000 })
      .catch(() => {});

    await page.waitForURL('**/meal-plans/**', { timeout: 180_000 });
    await expect(page.getByRole('tab').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Fruehstueck|Mittagessen|Abendessen|Frühstück/i).first()).toBeVisible();
  });
});

test.describe('Meal Plans', () => {
  test('Ernaehrungsplaene-Seite laedt', async ({ page }) => {
    await page.goto('/meal-plans');
    await dismissCookieBanner(page);
    await page.waitForURL('**/meal-plans', { timeout: 10_000 });
    await expect(page.getByRole('button', { name: /Neuen Plan erstellen/i })).toBeVisible();
  });

  test('"Neuen Plan erstellen"-Button oeffnet Patienten-Auswahl', async ({ page }) => {
    await page.goto('/meal-plans');
    await dismissCookieBanner(page);
    await page.getByRole('button', { name: /Neuen Plan erstellen/i }).click();

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/Bewohner.*auswaehlen|auswählen|auswaehlen/i)).toBeVisible();
  });
});
