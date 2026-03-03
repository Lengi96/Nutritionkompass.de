import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Nutrikompass', () => {

  test('should load homepage and navigate', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Nutrikompass|nutrition/i);
  });

  test('should have navigation working', async ({ page }) => {
    await page.goto('/');

    // Check if navigation exists
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });

  test('should have login page accessible', async ({ page }) => {
    await page.goto('/login');

    // Check login form is visible
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button:has-text("Anmelden")')).toBeVisible();
  });
});
