import { expect } from '@playwright/test';
import { ROUTES } from '../constants/routes';
import { Then, When } from '../fixtures/index';

const RESET_HINT = 'Reset the database: docker compose down -v, then docker compose up -d';

When('I open the user menu', async ({ navBar }) => {
  await navBar.openUserMenu();
});

Then('I should see the page heading {string}', async ({ page }, heading: string) => {
  await expect(page.locator(`//h1[contains(normalize-space(.), "${heading}")]`)).toBeVisible();
});

Then('the user menu should show {string}', async ({ navBar }, text: string) => {
  await expect(navBar.roleLine).toHaveText(text);
});

Then(
  'the Acknowledge button should be disabled on every {string} alert',
  async ({ alertsPage }, severity: string) => {
    const alerts = alertsPage.activeAlertsWithSeverity(severity);
    const count = await alerts.count();
    expect(count, `No active ${severity} alerts found. ${RESET_HINT}`).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      await expect(alertsPage.acknowledgeButtonIn(alerts.nth(i))).toBeDisabled();
    }
  },
);

Then('the Acknowledge button should be enabled on every active alert', async ({ alertsPage }) => {
  const count = await alertsPage.activeAlerts.count();
  expect(count, `No active alerts found. ${RESET_HINT}`).toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    await expect(alertsPage.acknowledgeButtonIn(alertsPage.activeAlerts.nth(i))).toBeEnabled();
  }
});

// Sends the acknowledge request straight to the server, skipping the UI.
// Uses an alert id that does not exist, so no real alert is changed:
// a server that checks the role refuses the caller before it looks the alert up.
Then('a direct acknowledge request should be refused as forbidden', async ({ page, alertsPage }) => {
  const response = await page.request.post(ROUTES.acknowledgeAlert, {
    form: {
      id: '999999',
      acknowledgedBy: 'direct request',
      __RequestVerificationToken: await alertsPage.getAntiForgeryToken(),
    },
    maxRedirects: 0,
  });

  const location = response.headers()['location'] ?? '';
  const refused =
    response.status() === 403 || (response.status() === 302 && location.includes(ROUTES.accessDenied));

  expect(
    refused,
    `Expected 403 or a redirect to Access Denied, but got ${response.status()} ${location}`,
  ).toBe(true);
});

Then(
  'an acknowledge request without signing in should be redirected to the login page',
  async ({ request }) => {
    const response = await request.post(ROUTES.acknowledgeAlert, {
      form: { id: '1', acknowledgedBy: 'anonymous' },
      maxRedirects: 0,
    });

    expect(response.status()).toBe(302);
    expect(response.headers()['location']).toContain(ROUTES.login);
  },
);

Then('I should see the Access Denied page for user {string}', async ({ accessDeniedPage }, username: string) => {
  await expect(accessDeniedPage.heading).toBeVisible();
  await expect(accessDeniedPage.roleNotice).toContainText('Action Taker');
  await expect(accessDeniedPage.roleNotice).toContainText(username);
});