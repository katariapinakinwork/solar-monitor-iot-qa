import { expect, type Page } from '@playwright/test';
import { SESSION_COOKIE } from '../constants/cookies';
import { ROUTES } from '../constants/routes';
import { Then, When } from '../fixtures';
import { USERS } from '../test-data/login';

async function getSessionCookie(page: Page) {
  const cookies = await page.context().cookies();
  const cookie = cookies.find((c) => c.name === SESSION_COOKIE);
  if (!cookie) throw new Error('Session cookie not found');
  return cookie;
}

When('I open the {string} page', async ({ page }, path: string) => {
  await page.goto(path);
});

When('I click Sign In without entering credentials', async ({ loginPage }) => {
  await loginPage.clickSignIn();
});

When('I sign out', async ({ navBar }) => {
  await navBar.signOut();
});

Then('I should be on the dashboard', async ({ page, dashboardPage }) => {
  await expect(page).toHaveURL(ROUTES.dashboard);
  await expect(dashboardPage.heading).toBeVisible();
});

Then('I should be on the {string} page', async ({ page }, path: string) => {
  await expect(page).toHaveURL(path);
});

Then('I should still be on the login page', async ({ page }) => {
  await expect(page).toHaveURL(/\/Account\/Login/);
});

Then('I should be redirected to the login page', async ({ page }) => {
  await expect(page).toHaveURL(/\/Account\/Login\?ReturnUrl=/);
});

Then(
  'the navigation bar should show user {string} with role {string}',
  async ({ navBar }, username: string, role: string) => {
    await expect(navBar.userName).toHaveText(username);
    await expect(navBar.roleBadge).toHaveText(role);
  },
);

Then('I should see the login error {string}', async ({ loginPage }, message: string) => {
  await expect(loginPage.errorAlert).toContainText(message);
});

Then('I should see the confirmation {string}', async ({ loginPage }, message: string) => {
  await expect(loginPage.successAlert).toContainText(message);
});

Then('the browser should flag the username as required', async ({ loginPage }) => {
  expect(await loginPage.isUsernameFlaggedAsRequired()).toBe(true);
});

Then('the session cookie should be HttpOnly', async ({ page }) => {
  const cookie = await getSessionCookie(page);
  expect(cookie.httpOnly).toBe(true);
});

Then('the session cookie should expire with the browser session', async ({ page }) => {
  const cookie = await getSessionCookie(page);
  expect(cookie.expires).toBe(-1); // -1 = no expiry date
});

Then('the session cookie should last about {int} days', async ({ page, dashboardPage }, days: number) => {
  await expect(dashboardPage.heading).toBeVisible();
  const cookie = await getSessionCookie(page);
  const daysLeft = (cookie.expires - Date.now() / 1000) / 86_400;
  expect(daysLeft).toBeGreaterThan(days - 1);
  expect(daysLeft).toBeLessThan(days + 1);
});

Then('a login request without the anti-forgery token should be rejected', async ({ request }) => {
  const response = await request.post(ROUTES.login, {
    form: { UsernameOrEmail: USERS.viewer.username, Password: USERS.viewer.password },
    maxRedirects: 0,
  });
  expect(response.status()).toBe(400);
});