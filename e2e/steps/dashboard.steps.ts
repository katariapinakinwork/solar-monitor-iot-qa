import { expect } from '@playwright/test';
import { DataTable } from 'playwright-bdd';
import { ALERT_SEVERITIES, PLANT_STATUSES } from '../constants/app';
import { Given, Then, When } from '../fixtures/index';
import type { KpiCard, StatusTile } from '../pages/dashboardPage';
import { parseNumber, sum } from '../utils/number';

// Each displayed figure is rounded, so totals are compared within a small margin.
const roundingMargin = (items: number) => 0.05 * items + 0.1;

Given('I have noted every plant on the Solar Plants page', async ({ plantsPage, ctx }) => {
  await plantsPage.open();
  ctx.plants = await plantsPage.readCards();
  expect(ctx.plants.length, 'The Solar Plants page should list at least one plant').toBeGreaterThan(0);
});

Given('I have counted the plants for each status on the Solar Plants page', async ({ plantsPage, ctx }) => {
  await plantsPage.open();
  ctx.plants = await plantsPage.readCards();
  for (const status of PLANT_STATUSES) {
    await plantsPage.open({ status });
    ctx.statusCounts[status] = await plantsPage.plantCards.count();
  }
});

Given('I have noted the {string} count on the Alerts page', async ({ alertsPage, ctx }, label: string) => {
  await alertsPage.open();
  ctx.values[label] = await alertsPage.summaryCount(label);
});

When('I click View All Plants on the dashboard', async ({ dashboardPage }) => {
  await dashboardPage.clickViewAllPlants();
});

When('I click View all in the Recent Alerts card', async ({ dashboardPage }) => {
  await dashboardPage.clickRecentAlertsViewAll();
});

Then('I should see the KPI cards:', async ({ dashboardPage }, table: DataTable) => {
  for (const [label] of table.raw()) {
    await expect(dashboardPage.kpiCard(label as KpiCard), `${label} card`).toBeVisible();
    expect(Number.isFinite(await dashboardPage.kpiValue(label as KpiCard)), `${label} value is a number`).toBe(true);
  }
});

Then('the Total Capacity card should equal the sum of the plant capacities', async ({ dashboardPage, ctx }) => {
  expect(await dashboardPage.kpiValue('Total Capacity')).toBe(sum(ctx.plants.map((p) => p.capacityKw)));
});

Then('the dashboard should report the same number of plants', async ({ dashboardPage, ctx }) => {
  expect(parseNumber(await dashboardPage.kpiSubtext('Total Capacity'))).toBe(ctx.plants.length);
});

Then('the Today card should match the total generation of the plants today', async ({ dashboardPage, ctx }) => {
  const dashboardToday = await dashboardPage.kpiValue("Today's Generation");
  const plantsToday = sum(ctx.plants.map((p) => p.todayKwh));
  expect(Math.abs(dashboardToday - plantsToday)).toBeLessThanOrEqual(roundingMargin(ctx.plants.length));
});

Then(
  'the {string} tile should equal the number of {string} plants',
  async ({ dashboardPage, ctx }, tile: string, status: string) => {
    expect(await dashboardPage.statusTileCount(tile as StatusTile)).toBe(ctx.statusCounts[status]);
  },
);

Then(
  'the {string} tile should equal the number of {string} and {string} plants',
  async ({ dashboardPage, ctx }, tile: string, first: string, second: string) => {
    expect(await dashboardPage.statusTileCount(tile as StatusTile)).toBe(
      ctx.statusCounts[first] + ctx.statusCounts[second],
    );
  },
);

Then('the status tiles should add up to the number of plants', async ({ dashboardPage, ctx }) => {
  const total =
    (await dashboardPage.statusTileCount('Online')) +
    (await dashboardPage.statusTileCount('Offline')) +
    (await dashboardPage.statusTileCount('Maint./Degraded'));
  expect(total).toBe(ctx.plants.length);
});

Then(
  'the {string} tile should equal the noted {string} count',
  async ({ dashboardPage, ctx }, tile: string, label: string) => {
    expect(await dashboardPage.statusTileCount(tile as StatusTile)).toBe(ctx.values[label]);
  },
);

Then('the fleet performance should be between 0 and 100 percent', async ({ dashboardPage }) => {
  const percent = await dashboardPage.kpiValue('Fleet Performance');
  expect(percent).toBeGreaterThanOrEqual(0);
  expect(percent).toBeLessThanOrEqual(100);
});

Then('the fleet performance should equal the PR ratio times 100', async ({ dashboardPage }) => {
  const percent = await dashboardPage.kpiValue('Fleet Performance');
  const ratio = parseNumber(await dashboardPage.kpiSubtext('Fleet Performance'));
  expect(Math.abs(percent - ratio * 100)).toBeLessThanOrEqual(0.1);
});

Then('the hourly production chart should show whole hours in time order', async ({ dashboardPage }) => {
  const { labels, values } = await dashboardPage.hourlyChart();
  expect(labels.length).toBe(values.length);
  for (const label of labels) expect(label).toMatch(/^\d{2}:00$/);
  expect(labels).toEqual([...labels].sort());
});

Then('the hourly production chart should add up to the Today card', async ({ dashboardPage }) => {
  const { values } = await dashboardPage.hourlyChart();
  const today = await dashboardPage.kpiValue("Today's Generation");
  expect(Math.abs(sum(values) - today)).toBeLessThanOrEqual(roundingMargin(values.length));
});

Then('the Plants Overview table should have one row per plant', async ({ dashboardPage, ctx }) => {
  await expect(dashboardPage.plantsOverviewRows).toHaveCount(ctx.plants.length);
});

Then('every Plants Overview row should show a capacity and a status', async ({ dashboardPage }) => {
  const rows = dashboardPage.plantsOverviewRows;
  const count = await rows.count();

  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);

    await expect(
      dashboardPage.plantCapacity(row)
    ).toContainText(/\d[\d,]* kW/);

    await expect.poll(async () =>
      dashboardPage.trimmedText(
        dashboardPage.plantStatusBadge(row)
      )
    ).toMatch(new RegExp(`^(${PLANT_STATUSES.join('|')})$`));
  }
});

Then('the Recent Alerts card should list between 1 and 5 alerts', async ({ dashboardPage }) => {
  const count = await dashboardPage.recentAlertItems.count();
  expect(count).toBeGreaterThanOrEqual(1);
  expect(count).toBeLessThanOrEqual(5);
});

Then('every recent alert should show a severity badge', async ({ dashboardPage }) => {
  const items = dashboardPage.recentAlertItems;
  const count = await items.count();

  for (let i = 0; i < count; i++) {
    await expect.poll(async () =>
      dashboardPage.trimmedText(
        dashboardPage.alertSeverityBadge(items.nth(i))
      )
    ).toMatch(new RegExp(`^(${ALERT_SEVERITIES.join('|')})$`));
  }
});