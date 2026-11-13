import { expect } from '@playwright/test';
import { Then, When } from '../fixtures';
import { utcDate } from '../utils/dates';
import { sum } from '../utils/number';

const CO2_TONNES_PER_KWH = 0.000716;

When('I generate the report for plant {string}', async ({ reportsPage }, plant: string) => {
  await reportsPage.open();
  await reportsPage.choosePlant(plant);
  await reportsPage.clickGenerate();
});

When(
  'I generate a {string} report for {string} from {int} days ago to {int} days ago',
  async ({ reportsPage }, type: string, plant: string, fromDays: number, toDays: number) => {
    await reportsPage.open();
    await reportsPage.choosePlant(plant);
    await reportsPage.enterStartDate(utcDate(-fromDays));
    await reportsPage.enterEndDate(utcDate(-toDays));
    await reportsPage.chooseType(type);
    await reportsPage.clickGenerate();
  },
);

When('I click the reset button on the report form', async ({ reportsPage }) => {
  await reportsPage.clickReset();
});

When('I open the report from {int} to {int} days from now', async ({ reportsPage }, from: number, to: number) => {
  await reportsPage.open({ startDate: utcDate(from), endDate: utcDate(to) });
});

When('I open a report whose start date is after its end date', async ({ reportsPage }) => {
  await reportsPage.open({ startDate: utcDate(-1), endDate: utcDate(-10) });
});

Then('the report form should show the default parameters', async ({ reportsPage }) => {
  await expect(reportsPage.heading).toBeVisible();
  await expect(reportsPage.plantSelect).toHaveValue('');
  await expect(reportsPage.startDateInput).toHaveValue(utcDate(-30));
  await expect(reportsPage.endDateInput).toHaveValue(utcDate(0));
  await expect(reportsPage.typeSelect).toHaveValue('daily');
});

Then('the report form should offer every plant and the three report types', async ({ reportsPage, ctx }) => {
  const plantLabels = (await reportsPage.plantOptions()).map((o) => o.label);
  expect(plantLabels[0]).toBe('All Plants');
  expect(plantLabels.slice(1).sort()).toEqual(ctx.plants.map((p) => p.name).sort());
  expect(await reportsPage.typeOptionLabels()).toEqual(['Hourly', 'Daily', 'Monthly']);
});

Then('the daily rows should be unique, in date order and inside the last 30 days', async ({ reportsPage }) => {
  const periods = (await reportsPage.readRows()).map((r) => r.period);
  expect(periods.length, 'The default report should have data').toBeGreaterThan(0);
  for (const p of periods) expect(p).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(new Set(periods).size).toBe(periods.length);
  expect(periods).toEqual([...periods].sort());
  expect(periods[0] >= utcDate(-30)).toBe(true);
  expect(periods[periods.length - 1] <= utcDate(0)).toBe(true);
});

Then('the row count badge should match the number of rows', async ({ reportsPage }) => {
  await expect(reportsPage.rowCountBadge).toHaveText(`${await reportsPage.rows.count()} rows`);
});

Then('the KPI cards and the table footer should agree with the table rows', async ({ reportsPage }) => {
  const rows = await reportsPage.readRows();
  const total = sum(rows.map((r) => r.energyKwh));
  const peak = Math.max(...rows.map((r) => r.peakKw));
  const avgPr = sum(rows.map((r) => r.prPercent)) / rows.length;

  expect(Math.abs((await reportsPage.footerTotal()) - total)).toBeLessThanOrEqual(0.02);
  expect(Math.abs((await reportsPage.kpiValue('Total kWh')) - total)).toBeLessThanOrEqual(0.06);
  expect(Math.abs((await reportsPage.kpiValue('Peak Power (kW)')) - peak)).toBeLessThanOrEqual(0.06);
  expect(Math.abs((await reportsPage.kpiValue('Avg Performance Ratio')) - avgPr)).toBeLessThanOrEqual(0.2);
});

Then('CO2 avoided should equal the total energy times 0.000716 tonnes per kWh', async ({ reportsPage }) => {
  const total = sum((await reportsPage.readRows()).map((r) => r.energyKwh));
  const co2 = await reportsPage.kpiValue('CO₂ Avoided (t)');
  expect(Math.abs(co2 - total * CO2_TONNES_PER_KWH)).toBeLessThanOrEqual(0.02);
});

Then('the hourly rows should be whole hours in time order', async ({ reportsPage }) => {
  const periods = (await reportsPage.readRows()).map((r) => r.period);
  expect(periods.length).toBeGreaterThan(0);
  for (const p of periods) expect(p).toMatch(/^\d{4}-\d{2}-\d{2} ([01]\d|2[0-3]):00$/);
  expect(new Set(periods).size).toBe(periods.length);
  expect(periods).toEqual([...periods].sort());
});

Then('the monthly rows should be calendar months, at most two of them', async ({ reportsPage }) => {
  const periods = (await reportsPage.readRows()).map((r) => r.period);
  expect(periods.length).toBeGreaterThan(0);
  expect(periods.length).toBeLessThanOrEqual(2);
  for (const p of periods) expect(p).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
});

Then('the hourly, daily and monthly reports should show the same total energy', async ({ reportsPage }) => {
  const totals: number[] = [];
  for (const reportType of ['hourly', 'daily', 'monthly']) {
    await reportsPage.open({ reportType });
    totals.push(await reportsPage.footerTotal());
  }
  const [hourly, daily, monthly] = totals;
  const margin = Math.max(5, daily * 0.001);
  expect(Math.abs(hourly - daily), `hourly ${hourly} vs daily ${daily}`).toBeLessThanOrEqual(margin);
  expect(Math.abs(monthly - daily), `monthly ${monthly} vs daily ${daily}`).toBeLessThanOrEqual(margin);
});

Then('the plant totals should add up to the All Plants total', async ({ reportsPage }) => {
  await reportsPage.open();
  const fleetTotal = await reportsPage.footerTotal();
  const plants = (await reportsPage.plantOptions()).filter((o) => o.value !== '');

  let plantTotals = 0;
  for (const plant of plants) {
    await reportsPage.open({ plantId: plant.value });
    if ((await reportsPage.rows.count()) > 0) plantTotals += await reportsPage.footerTotal();
  }
  expect(Math.abs(plantTotals - fleetTotal), `plants ${plantTotals} vs fleet ${fleetTotal}`).toBeLessThanOrEqual(2);
});

Then(
  'the report form should show plant {string}, from {int} days ago to {int} days ago, type {string}',
  async ({ reportsPage }, plant: string, fromDays: number, toDays: number, type: string) => {
    expect(await reportsPage.selectedPlantLabel()).toBe(plant);
    await expect(reportsPage.startDateInput).toHaveValue(utcDate(-fromDays));
    await expect(reportsPage.endDateInput).toHaveValue(utcDate(-toDays));
    await expect(reportsPage.typeSelect).toHaveValue(type.toLowerCase());
  },
);

Then('the No data message should be shown', async ({ reportsPage }) => {
  await expect(reportsPage.noDataMessage).toBeVisible();
  await expect(reportsPage.table).toHaveCount(0);
});

Then('a report for a single past day should return exactly that day', async ({ reportsPage }) => {
  await reportsPage.open();
  const [first] = await reportsPage.readRows();
  expect(first, 'The default report should have data').toBeDefined();

  await reportsPage.open({ startDate: first.period, endDate: first.period });
  expect((await reportsPage.readRows()).map((r) => r.period)).toEqual([first.period]);
});

Then('the chart should plot exactly the table data', async ({ reportsPage }) => {
  const rows = await reportsPage.readRows();
  const chart = await reportsPage.chart();
  expect(chart.labels).toEqual(rows.map((r) => r.period));
  expect(chart.values).toEqual(rows.map((r) => r.energyKwh));
});

Then('each Avg PR value should be coloured by its threshold', async ({ reportsPage }) => {
  for (const row of await reportsPage.readRows()) {
    // The shown value is rounded, so rows right at a threshold are ambiguous and skipped.
    if ([80, 70].some((t) => Math.abs(row.prPercent - t) < 0.1)) continue;
    const expected = row.prPercent >= 80 ? 'text-success' : row.prPercent >= 70 ? 'text-warning' : 'text-danger';
    expect(row.prClass, `${row.period} at ${row.prPercent}%`).toContain(expected);
  }
});

Then('the report should either show data or explain the date problem', async ({ reportsPage }) => {
  const hasRows = (await reportsPage.rows.count()) > 0;
  const hasMessage = (await reportsPage.dateValidationMessage.count()) > 0;
  expect(hasRows || hasMessage, 'An inverted date range should be corrected or explained, not silently empty').toBe(true);
});

Then('Peak Power should be at least the highest hourly energy', async ({ reportsPage }) => {
  // A fleet that produces X kWh in one hour must reach at least X kW at some point in that hour.
  const highestHour = Math.max(...(await reportsPage.readRows()).map((r) => r.energyKwh));
  const peak = await reportsPage.kpiValue('Peak Power (kW)');
  expect(peak, `Peak ${peak} kW vs highest hourly energy ${highestHour} kWh`).toBeGreaterThanOrEqual(highestHour);
});