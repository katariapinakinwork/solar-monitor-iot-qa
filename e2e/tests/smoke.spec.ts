import { test, expect } from '@playwright/test';

test('login page loads', async ({ page }) => {
  await page.goto('/Account/Login');
  await expect(page.getByRole('heading', { name: 'Operator Portal Sign In' })).toBeVisible();
});