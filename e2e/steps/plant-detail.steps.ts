import { expect, type Locator } from '@playwright/test';
import { Then, When } from '../fixtures/index';
import { parseNumber, sum } from '../utils/number';

const PANEL_STATUSES = ['Active', 'Faulty', 'Offline', 'Underperforming'];

// Each displayed figure is rounded to one decimal, so totals are compared within a small margin.
const roundingMargin = (items: number) => 0.05 * items + 0.1;

const backgroundColour = (badge: Locator) => badge.evaluate((el) => getComputedStyle(el).backgroundColor);

When('I open the detail page of {string}', async ({ plantsPage, plantDetailPage, ctx }, name: string) => {
  if (!ctx.plants.some((p) => p.name === name)) {
    await plantsPage.open();
    ctx.plants = await plantsPage.readCards();
  }
  const plant = ctx.plants.find((p) => p.name === name);
  expect(plant, `"${name}" should be listed on the Solar Plants page`).toBeDefined();

  ctx.current = plant;
  await plantDetailPage.open(plant!.id);
});

Then(
  'the detail page should show the same name, status, location, capacity, panels and region as its card',
  async ({ plantDetailPage, ctx }) => {
    const plant = ctx.current!;
    await expect(plantDetailPage.title).toHaveText(plant.name);
    await expect(plantDetailPage.statusBadge).toHaveText(plant.status);
    await expect(plantDetailPage.headerLine).toContainText(plant.location);
    expect(parseNumber(await plantDetailPage.info('Capacity'))).toBe(plant.capacityKw);
    expect(parseNumber(await plantDetailPage.info('Total Panels'))).toBe(plant.panels);
    expect(await plantDetailPage.info('Region')).toBe(plant.region);
  },
);

Then('kWh Today should match the plant card', async ({ plantDetailPage, ctx }) => {
  const detailToday = await plantDetailPage.kpiValue('kWh Today');
  expect(Math.abs(detailToday - ctx.current!.todayKwh)).toBeLessThanOrEqual(0.11);
});

Then('the panel inventory should be complete and well-formed', async ({ plantDetailPage }) => {
  const panels = await plantDetailPage.readPanels();
  expect(panels.length).toBeGreaterThan(0);
  expect(parseNumber(await plantDetailPage.panelCountBadge.innerText())).toBe(panels.length);

  const serials = panels.map((p) => p.serial);
  expect(new Set(serials).size, 'serial numbers are unique').toBe(serials.length);

  for (const panel of panels) {
    expect(panel.serial).toMatch(/^SP-\d{2}-\d{6}$/);
    expect(panel.stringGroup).toMatch(/^INV-\d{2}-STR-\d$/);
    expect(panel.model, `${panel.serial}: model`).not.toBe('');
    expect(PANEL_STATUSES, `${panel.serial}: status`).toContain(panel.status);

    // Faulty panels have no efficiency reading and show a dash.
    if (panel.status === 'Faulty') expect(panel.efficiency, `${panel.serial}: efficiency`).toBe('—');
    else expect(panel.efficiency, `${panel.serial}: efficiency`).toMatch(/^\d+\.\d%$/);
  }
});

Then('Panels Active should equal the number of Active panels in the inventory', async ({ plantDetailPage }) => {
  const active = (await plantDetailPage.readPanels()).filter((p) => p.status === 'Active').length;
  expect(await plantDetailPage.kpiValue('Panels Active')).toBe(active);
});

Then('Panels Faulty should equal the number of Faulty panels in the inventory', async ({ plantDetailPage }) => {
  const faulty = (await plantDetailPage.readPanels()).filter((p) => p.status === 'Faulty').length;
  expect(await plantDetailPage.kpiValue('Panels Faulty')).toBe(faulty);
});

Then('both production charts should be drawn and add up to the KPI cards', async ({ plantDetailPage }) => {
  const hourly = await plantDetailPage.hourlyChart();
  const daily = await plantDetailPage.dailyChart();
  expect(hourly.labels.length).toBe(hourly.values.length);
  expect(daily.labels.length).toBe(daily.values.length);

  const today = await plantDetailPage.kpiValue('kWh Today');
  const month = await plantDetailPage.kpiValue('kWh This Month');
  expect(Math.abs(sum(hourly.values) - today)).toBeLessThanOrEqual(roundingMargin(hourly.values.length));
  expect(Math.abs(sum(daily.values) - month)).toBeLessThanOrEqual(roundingMargin(daily.values.length));
});

Then('the active-alert banner on each detail page should match the plant card', async ({ plantDetailPage, ctx }) => {
  for (const plant of ctx.plants) {
    await plantDetailPage.open(plant.id);
    if (plant.activeAlerts > 0) {
      await expect(plantDetailPage.alertBanner, plant.name).toContainText(`${plant.activeAlerts} active alert(s)`);
    } else {
      await expect(plantDetailPage.alertBanner, plant.name).toHaveCount(0);
    }
  }
});

Then(
  'the status badge should have the same colour as on the Solar Plants page',
  async ({ plantsPage, plantDetailPage, ctx }) => {
    const detailColour = await backgroundColour(plantDetailPage.statusBadge);

    await plantsPage.open();
    const listColour = await backgroundColour(plantsPage.plantStatus(plantsPage.plantDetailCards(ctx.current!.name)));

    expect(detailColour, `Detail page ${detailColour} vs Solar Plants page ${listColour}`).toBe(listColour);
  },
);

Then('the generation figures should all be zero', async ({ plantDetailPage }) => {
  await expect(plantDetailPage.title).toBeVisible();
  expect(await plantDetailPage.kpiValue('kWh Today')).toBe(0);
  expect(await plantDetailPage.kpiValue('kWh This Month')).toBe(0);
  expect(await plantDetailPage.kpiValue('kW Current')).toBe(0);
});