import { expect, type Locator } from '@playwright/test';
import { Given, Then, When } from '../fixtures';
import type { AlertsPage } from '../pages/alertsPage';

const SEVERITY_RANK: Record<string, number> = { Critical: 2, Warning: 1, Info: 0 };
const ALERT_TYPES = /^(Performance|Equipment|Weather|Communication|Safety)$/;
const RESET_HINT = 'Reset the database: docker compose down -v, then docker compose up -d';

// Picks an active alert to acknowledge, but never the last one of its severity:
// the role tests need at least one Critical, one Warning and one Info alert to stay active.
async function pickAlert(alertsPage: AlertsPage): Promise<Locator> {
  await alertsPage.activeAlerts.first().waitFor({ state: 'attached' }).catch(() => {});
  for (const severity of ['Warning', 'Info', 'Critical']) {
    const candidates = alertsPage.activeAlertsWithSeverity(severity);
    if ((await candidates.count()) > 1) return candidates.first();
  }
  throw new Error(
    `No severity has more than one active alert left to acknowledge (earlier runs used them up). ${RESET_HINT}`,
  );
}

// Records which alert was picked, plus the active count before acknowledging it.
async function remember(alertsPage: AlertsPage, alert: Locator, ctx: { alert?: unknown; values: Record<string, number> }) {
  ctx.alert = {
    id: (await alert.getAttribute('data-alert-id')) ?? '',
    title: (await alertsPage.alertTitle(alert).innerText()).trim(),
    plant: (await alertsPage.alertPlant(alert).innerText()).trim(),
  };
  ctx.values['activeBefore'] = await alertsPage.summaryCount('Active Alerts');
}

// ---------- Setup ----------

Given('the browser window is {int} by {int} pixels', async ({ page }, width: number, height: number) => {
  await page.setViewportSize({ width, height });
});

// ---------- Actions ----------

When('I filter the alerts by severity {string}', async ({ alertsPage, ctx }, severity: string) => {
  ctx.values['activeBefore'] = await alertsPage.summaryCount('Active Alerts');
  await alertsPage.filterBySeverity(severity);
});

When('I clear the alert filters', async ({ alertsPage }) => {
  await alertsPage.clickClear();
});

When('I open the Resolved tab', async ({ alertsPage }) => {
  await alertsPage.clickResolvedTab();
});

When('I acknowledge an active alert as {string}', async ({ alertsPage, ctx }, operator: string) => {
  const alert = await pickAlert(alertsPage);
  await remember(alertsPage, alert, ctx);
  await alertsPage.acknowledge(alert, operator);
});

When('I try to acknowledge an active alert without entering a name', async ({ alertsPage, ctx }) => {
  const alert = await pickAlert(alertsPage);
  await remember(alertsPage, alert, ctx);
  await alertsPage.acknowledge(alert, '');
});

When('I send another acknowledge request for the same alert as {string}', async ({ alertsPage, ctx }, operator: string) => {
  await alertsPage.open();
  await alertsPage.postAcknowledge(ctx.alert!.id, operator);
});

// ---------- Listing, ordering and details ----------

Then('the Active Alerts counter should equal Critical plus Warning plus Info', async ({ alertsPage }) => {
  const parts =
    (await alertsPage.summaryCount('Critical')) +
    (await alertsPage.summaryCount('Warning')) +
    (await alertsPage.summaryCount('Info'));
  expect(await alertsPage.summaryCount('Active Alerts')).toBe(parts);
});

Then('the Active tab badge and the list should both match the Active Alerts counter', async ({ alertsPage }) => {
  const total = await alertsPage.summaryCount('Active Alerts');
  expect(total, `No active alerts. ${RESET_HINT}`).toBeGreaterThan(0);
  expect(await alertsPage.tabBadgeCount('Active')).toBe(total);
  await expect(alertsPage.activeAlerts).toHaveCount(total);
});

Then('the active alerts should be ordered from most to least severe', async ({ alertsPage }) => {
  const ranks = (await alertsPage.activeSeverities()).map((s) => SEVERITY_RANK[s]);
  expect(ranks).toEqual([...ranks].sort((a, b) => b - a));
});

Then('every active alert should show its title, plant, time, type and severity', async ({ alertsPage }) => {
  const count = await alertsPage.activeAlerts.count();
  expect(count, `No active alerts. ${RESET_HINT}`).toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    const alert = alertsPage.activeAlerts.nth(i);
    await expect(alertsPage.alertTitle(alert)).not.toBeEmpty();
    await expect(alertsPage.alertPlant(alert)).not.toBeEmpty();
    await expect(alertsPage.alertTime(alert)).toHaveText(/^[A-Z][a-z]{2} \d{2}, \d{4} \d{2}:\d{2}$/);
    await expect(alertsPage.alertType(alert)).toHaveText(ALERT_TYPES);
    await expect(alertsPage.alertSeverityBadge(alert)).toHaveText(/^(Critical|Warning|Info)$/);
  }
});

// ---------- Filters and tabs ----------

Then('only {string} alerts should be listed', async ({ alertsPage }, severity: string) => {
  const severities = await alertsPage.activeSeverities();
  if (severities.length === 0) await expect(alertsPage.noActiveAlertsMessage).toBeVisible();
  for (const s of severities) expect(s).toBe(severity);
});

Then('the severity filter should still show {string}', async ({ alertsPage }, severity: string) => {
  await expect(alertsPage.severityFilter).toHaveValue(severity);
});

Then('the Active Alerts counter should be unchanged by the filter', async ({ alertsPage, ctx }) => {
  expect(await alertsPage.summaryCount('Active Alerts')).toBe(ctx.values['activeBefore']);
});

Then('filtering by each plant should list only that plants alerts', async ({ alertsPage }) => {
  await alertsPage.open();
  const plants = await alertsPage.plantFilterOptions();
  expect(plants.length).toBeGreaterThan(1);

  for (const plant of plants) {
    await alertsPage.open();
    await alertsPage.filterByPlant(plant);
    for (const shown of await alertsPage.activePlantNames()) expect(shown, `Filter "${plant}"`).toBe(plant);
  }
});

Then('the alert filters should be cleared', async ({ page, alertsPage }) => {
  await expect(page).toHaveURL(/\/Alerts$/);
  await expect(alertsPage.severityFilter).toHaveValue('');
  await expect(alertsPage.plantFilter).toHaveValue('');
});

Then('the address should still contain {string}', async ({ page }, text: string) => {
  expect(page.url()).toContain(text);
});

Then('every resolved alert should be marked Resolved with its resolved time', async ({ alertsPage }) => {
  const count = await alertsPage.resolvedAlerts.count();
  expect(count).toBeLessThanOrEqual(20);
  expect(await alertsPage.tabBadgeCount('Resolved')).toBe(count);

  for (let i = 0; i < count; i++) {
    const item = alertsPage.resolvedAlerts.nth(i);
    await expect(item.locator("xpath=.//span[contains(@class,'badge')]")).toHaveText('Resolved');
    await expect(item).toContainText('Resolved:');
  }
});

// ---------- Acknowledge window ----------

Then('the acknowledge window should open for the alert I click, and Cancel should change nothing', async ({ alertsPage }) => {
  const count = await alertsPage.activeAlerts.count();
  expect(count, `Needs at least two active alerts. ${RESET_HINT}`).toBeGreaterThanOrEqual(2);
  const before = await alertsPage.summaryCount('Active Alerts');

  for (const index of [0, 1]) {
    const alert = alertsPage.activeAlerts.nth(index);
    const id = (await alert.getAttribute('data-alert-id')) ?? '';
    const title = (await alertsPage.alertTitle(alert).innerText()).trim();

    await alertsPage.openAcknowledgeWindow(alert);
    await expect(alertsPage.acknowledgeWindowAlertId).toHaveValue(id);
    await expect(alertsPage.acknowledgeWindowTitle).toHaveText(title);
    await alertsPage.cancelAcknowledge();
  }

  expect(await alertsPage.summaryCount('Active Alerts')).toBe(before);
  await expect(alertsPage.successBanner).toHaveCount(0);
});

// ---------- After acknowledging ----------

Then('I should see the acknowledgement confirmation for that alert', async ({ alertsPage, ctx }) => {
  await expect(alertsPage.successBanner).toContainText(`Alert #${ctx.alert!.id} has been acknowledged and resolved.`);
});

Then('the alert should no longer be listed as active', async ({ alertsPage, ctx }) => {
  await alertsPage.open();
  await expect(alertsPage.activeAlert(ctx.alert!.id)).toHaveCount(0);
});

Then('the alert should still be listed as active', async ({ alertsPage, ctx }) => {
  await alertsPage.open();
  await expect(alertsPage.activeAlert(ctx.alert!.id)).toHaveCount(1);
});

Then('the Active Alerts counter should have dropped by one', async ({ alertsPage, ctx }) => {
  await alertsPage.open();
  expect(await alertsPage.summaryCount('Active Alerts')).toBe(ctx.values['activeBefore'] - 1);
});

Then('the alert should be listed under Resolved by {string}', async ({ alertsPage, ctx }, operator: string) => {
  await alertsPage.openResolvedTab();
  const entry = alertsPage.resolvedAlert(ctx.alert!.title, ctx.alert!.plant);
  await expect(entry).toHaveCount(1);
  await expect(entry).toContainText(`By: ${operator}`);
});

Then('the operator name should be shown as text, not markup', async ({ alertsPage, ctx }) => {
  await alertsPage.openResolvedTab();
  await expect(alertsPage.resolvedAlert(ctx.alert!.title, ctx.alert!.plant).locator('xpath=.//b')).toHaveCount(0);
});

Then('the resolved alert should still show {string} and not {string}', async ({ alertsPage, ctx }, kept: string, replaced: string) => {
  await alertsPage.openResolvedTab();
  const entry = alertsPage.resolvedAlert(ctx.alert!.title, ctx.alert!.plant);
  await expect(entry).toContainText(`By: ${kept}`);
  await expect(entry).not.toContainText(replaced);
});

Then('the plant of that alert should show one fewer active alert on the Solar Plants page', async ({ plantsPage, ctx }) => {
  const before = ctx.plants.find((p) => p.name === ctx.alert!.plant);
  expect(before, `"${ctx.alert!.plant}" should have been noted beforehand`).toBeDefined();

  await plantsPage.open();
  const after = (await plantsPage.readCards()).find((p) => p.name === ctx.alert!.plant);
  expect(after!.activeAlerts).toBe(before!.activeAlerts - 1);
});

// ---------- Direct requests ----------

Then('acknowledging alert {string} directly should return status {int}', async ({ alertsPage }, id: string, status: number) => {
  await alertsPage.open();
  expect((await alertsPage.postAcknowledge(id, 'QA')).status()).toBe(status);
});

Then('an acknowledge request without the anti-forgery token should be rejected', async ({ alertsPage }) => {
  await alertsPage.open();
  expect((await alertsPage.postAcknowledge('999999', 'QA', false)).status()).toBe(400);
});