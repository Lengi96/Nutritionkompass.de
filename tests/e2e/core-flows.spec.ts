import { test, expect } from '@playwright/test';

// Credentials aus Umgebungsvariablen (Fallback auf Seed-Daten)
const TEST_PATIENT = process.env.E2E_PATIENT ?? 'Sonnenschein';

// Alle Tests laufen bereits eingeloggt (storageState aus auth.setup.ts)

// ─── 1. Login-Flow ──────────────────────────────────────────────────────────
test.describe('Login', () => {

  test('eingeloggter User landet auf Dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText('Aktive Bewohner:innen')).toBeVisible();
  });

  test('geschützte Route leitet nicht eingeloggten User zum Login', async ({ browser }) => {
    // Neuer Context ohne gespeicherten Auth-State
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

    // Cookie-Banner schließen
    const banner = page.getByRole('dialog', { name: /Cookie/i });
    if (await banner.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await page.getByRole('button', { name: /Nur notwendige/i }).click();
    }

    await page.fill('#email', 'falsch@test.de');
    await page.fill('#password', 'falschesPasswort');
    await page.click('button:has-text("Anmelden")');

    await expect(
      page.getByText(/Ungültige Anmeldedaten|E-Mail oder Passwort/i)
    ).toBeVisible({ timeout: 8_000 });

    await context.close();
  });

});

// ─── 2. Patienten-Liste ─────────────────────────────────────────────────────
test.describe('Patienten', () => {

  test('Patienten-Übersicht lädt mit Tabelle', async ({ page }) => {
    await page.goto('/patients');
    await expect(page.getByText('Bewohner:innen')).toBeVisible();
    await expect(page.getByText(TEST_PATIENT)).toBeVisible({ timeout: 10_000 });
  });

  test('Suchfeld filtert Patienten', async ({ page }) => {
    await page.goto('/patients');

    const searchInput = page.locator('input[placeholder*="Pseudonym"]');
    await expect(searchInput).toBeVisible();

    await searchInput.fill('XYZNOTEXISTENT');
    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(0, { timeout: 5_000 });

    // Suche zurücksetzen
    await searchInput.clear();
    await expect(page.getByText(TEST_PATIENT)).toBeVisible({ timeout: 5_000 });
  });

  test('Patienten-Detailseite zeigt Tabs und Plan-Button', async ({ page }) => {
    await page.goto('/patients');
    await page.getByText(TEST_PATIENT).first().click();

    await expect(page.getByRole('heading', { name: TEST_PATIENT })).toBeVisible({
      timeout: 8_000,
    });
    await expect(page.getByRole('button', { name: /Plan generieren/i })).toBeVisible();

    // Tabs vorhanden
    await expect(page.getByRole('tab', { name: /Übersicht/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Ernährungspläne/i })).toBeVisible();
  });

});

// ─── 3. Plan-Generierung ────────────────────────────────────────────────────
test.describe('Plan-Generierung', () => {

  test('Plan-Modal öffnet sich mit korrekten Feldern', async ({ page }) => {
    await page.goto('/patients');

    // "Plan"-Button in der Zeile des Test-Patienten klicken
    const row = page.locator('tr', { hasText: TEST_PATIENT });
    await row.getByRole('button', { name: /Plan/i }).click();

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Plan generieren')).toBeVisible();
    await expect(page.locator('#numDays')).toBeVisible();
    await expect(page.locator('#weekStart')).toBeVisible();
    await expect(page.locator('#additionalNotes')).toBeVisible();
  });

  test('generiert 3-Tage-Plan und öffnet Detailseite', async ({ page }) => {
    test.setTimeout(180_000);

    await page.goto('/patients');
    const row = page.locator('tr', { hasText: TEST_PATIENT });
    await row.getByRole('button', { name: /Plan/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // 3 Tage (schneller als 7)
    await page.fill('#numDays', '3');
    await page.fill('#additionalNotes', 'Einfache Rezepte, schnell zuzubereiten');

    // Generierung starten
    await page.getByRole('button', { name: /Plan generieren/i }).last().click();

    // Fortschrittsanzeige erscheint
    await expect(
      page.getByText(/Tag.*wird erstellt|Finalisiere/i)
    ).toBeVisible({ timeout: 20_000 });

    // Warte auf Redirect zur Plan-Seite
    await page.waitForURL('**/meal-plans/**', { timeout: 180_000 });

    // Plan-Detail: Tabs (Tage) und Mahlzeiten sichtbar
    await expect(page.getByRole('tab').first()).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByText(/Frühstück|Mittagessen|Abendessen/i)
    ).toBeVisible();
  });

});

// ─── 4. Meal Plans Liste ────────────────────────────────────────────────────
test.describe('Meal Plans', () => {

  test('Ernährungspläne-Seite lädt', async ({ page }) => {
    await page.goto('/meal-plans');
    await expect(page.getByText('Ernährungspläne')).toBeVisible();
  });

  test('"Neuen Plan erstellen"-Button öffnet Patienten-Auswahl', async ({ page }) => {
    await page.goto('/meal-plans');
    await page.getByRole('button', { name: /Neuen Plan erstellen/i }).click();

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
    await expect(
      page.getByText(/Bewohner.*auswählen|auswählen/i)
    ).toBeVisible();
  });

});
