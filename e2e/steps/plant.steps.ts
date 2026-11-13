import { expect } from '@playwright/test';
import { PLANT_STATUSES, type PlantStatus } from '../constants/app';
import { Then, When } from '../fixtures/index';

When('I search the plants for {string}', async ({ plantsPage }, text: string) => {
  await plantsPage.searchPlants(text);
});

When('I filter the plants by status {string}', async ({ plantsPage }, status: string) => {
  await plantsPage.filterByStatus(status as PlantStatus);
});

When('I filter the plants by region {string}', async ({ plantsPage }, region: string) => {
  await plantsPage.filterByRegion(region);
});

When(
  'I filter the plants with search {string}, status {string} and region {string}',
  async ({ plantsPage }, search: string, status: string, region: string) => {
    await plantsPage.applyFilters(search, status as PlantStatus, region);
  },
);

When('I clear the plant filters', async ({ plantsPage }) => {
  await plantsPage.clearFilters();
});

Then('the plants should be listed in alphabetical order', async ({ plantsPage }) => {
  const names = (await plantsPage.readCards()).map((p) => p.name);
  expect(names.length).toBeGreaterThan(0);
  expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
});

Then('the Showing count should equal the number of plant cards', async ({ plantsPage }) => {
  expect(await plantsPage.getShowingCount()).toBe(await plantsPage.plantCount());
});

Then('every plant card should show complete plant data', async ({ plantsPage }) => {
  for (const plant of await plantsPage.readCards()) {
    expect(plant.name, 'name').not.toBe('');
    expect(plant.location, `${plant.name}: location`).toContain(',');
    expect(PLANT_STATUSES as readonly string[], `${plant.name}: status`).toContain(plant.status);
    expect(plant.region, `${plant.name}: region`).not.toBe('');
    expect(plant.capacityKw, `${plant.name}: capacity`).toBeGreaterThan(0);
    expect(plant.todayKwh, `${plant.name}: today`).toBeGreaterThanOrEqual(0);
    expect(plant.panels, `${plant.name}: panels`).toBeGreaterThan(0);
    expect(plant.commissionedYear, `${plant.name}: commissioned`).toBeGreaterThan(2000);
  }
});

Then(
  'every listed plant should mention {string} in its name or location',
  async ({ plantsPage }, text: string) => {
    const plants = await plantsPage.readCards();
    expect(plants.length, `At least one plant should match "${text}"`).toBeGreaterThan(0);
    for (const plant of plants) expect(`${plant.name} ${plant.location}`).toContain(text);
  },
);

Then('only {string} should be listed', async ({ plantsPage }, name: string) => {
  expect((await plantsPage.readCards()).map((p) => p.name)).toEqual([name]);
});

Then('the No plants found message should be shown', async ({ plantsPage }) => {
  await expect(plantsPage.emptyState).toBeVisible();
  await expect(plantsPage.plantCards).toHaveCount(0);
  expect(await plantsPage.getShowingCount()).toBe(0);
});

Then('every listed plant should have status {string}', async ({ plantsPage }, status: string) => {
  const plants = await plantsPage.readCards();
  if (plants.length === 0) await expect(plantsPage.emptyState).toBeVisible();
  for (const plant of plants) expect(plant.status, plant.name).toBe(status);
});

Then('every listed plant should be in region {string}', async ({ plantsPage }, region: string) => {
  const plants = await plantsPage.readCards();
  expect(plants.length, `Region "${region}" should have plants`).toBeGreaterThan(0);
  for (const plant of plants) expect(plant.region, plant.name).toBe(region);
});

Then('the status counts should add up to the number of plants', async ({ ctx }) => {
  const counted = Object.values(ctx.statusCounts).reduce((total, n) => total + n, 0);
  expect(counted).toBe(ctx.plants.length);
});

Then(
  'the filter form should show search {string}, status {string} and region {string}',
  async ({ plantsPage }, search: string, status: string, region: string) => {
    expect(await plantsPage.getFilterValues()).toEqual({ search, status, region });
  },
);

Then('every plant should be listed with empty filters', async ({ page, plantsPage, ctx }) => {
  await expect(page).toHaveURL(/\/Plants$/);
  expect(await plantsPage.getFilterValues()).toEqual({ search: '', status: '', region: '' });
  await expect(plantsPage.plantCards).toHaveCount(ctx.plants.length);
});

Then('the alert count on each plant card should match the Alerts page', async ({ alertsPage, ctx }) => {
  for (const plant of ctx.plants) {
    await alertsPage.openForPlant(plant.id);
    await expect(alertsPage.activeAlerts, `Active alerts for ${plant.name}`).toHaveCount(plant.activeAlerts);
  }
});

Then('the search box should show {string}', async ({ plantsPage }, text: string) => {
  await expect(plantsPage.searchInput).toHaveValue(text);
});

Then('no script from the search text should have run', async ({ page }) => {
  expect(await page.evaluate(() => (window as any).__xss)).toBeUndefined();
  await expect(page.locator("//img[@src='x']")).toHaveCount(0);
});