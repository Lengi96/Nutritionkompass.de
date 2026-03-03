import { test as setup, expect } from '@playwright/test';
import path from 'path';

export const authFile = path.join(process.cwd(), '.playwright/auth/user.json');

const TEST_EMAIL = process.env.E2E_EMAIL ?? 'admin@mein-nutrikompass.de';
const TEST_PASSWORD = process.env.E2E_PASSWORD ?? 'Passwort123!';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');

  // Cookie-Banner schließen falls vorhanden
  const banner = page.getByRole('dialog', { name: /Cookie/i });
  if (await banner.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await page.getByRole('button', { name: /Nur notwendige/i }).click();
    await banner.waitFor({ state: 'hidden' });
  }

  // Login
  await page.fill('#email', TEST_EMAIL);
  await page.fill('#password', TEST_PASSWORD);
  await page.click('button:has-text("Anmelden")');

  // Warte auf erfolgreiches Login
  await page.waitForURL('**/dashboard', { timeout: 20_000 });
  await expect(page.locator('nav')).toBeVisible();

  // Session-State speichern → alle Tests können ihn wiederverwenden
  await page.context().storageState({ path: authFile });
  console.log('✅ Auth-State gespeichert');
});
