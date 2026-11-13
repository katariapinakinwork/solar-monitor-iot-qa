import type { Locator, Page } from '@playwright/test';
import { ROUTES } from '../constants/app';
import { readChart, type ChartData } from '../utils/charts';
import { parseNumber } from '../utils/number';

export type ReportKpi = 'Total kWh' | 'Avg Performance Ratio' | 'Peak Power (kW)' | 'CO₂ Avoided (t)';

export interface ReportParams {
  plantId?: string | number;
  startDate?: string;
  endDate?: string;
  reportType?: string;
}

export interface ReportRow {
  period: string;
  energyKwh: number;
  peakKw: number;
  prPercent: number;
  irradiance: number;
  prClass: string;
}

// The report form is the only form with a "reportType" select (the navbar has a Sign Out form).
const REPORT_FORM = "//form[.//select[@name='reportType']]";

export class ReportsPage {
  readonly heading: Locator;
  readonly plantSelect: Locator;
  readonly startDateInput: Locator;
  readonly endDateInput: Locator;
  readonly typeSelect: Locator;
  readonly table: Locator;
  readonly rows: Locator;
  readonly rowCountBadge: Locator;
  readonly noDataMessage: Locator;
  readonly dateValidationMessage: Locator;
  private readonly generateButton: Locator;
  private readonly resetButton: Locator;
  private readonly footerCells: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.locator("//h1[contains(normalize-space(.),'Energy Reports')]");
    this.plantSelect = page.locator("//select[@name='plantId']");
    this.startDateInput = page.locator("//input[@name='startDate']");
    this.endDateInput = page.locator("//input[@name='endDate']");
    this.typeSelect = page.locator("//select[@name='reportType']");
    this.table = page.locator("//table[@id='reportTable']");
    this.rows = page.locator("//table[@id='reportTable']/tbody/tr");
    this.rowCountBadge = page.locator("//span[contains(@class,'badge') and contains(normalize-space(.),'rows')]");
    this.noDataMessage = page.locator("//h5[normalize-space(.)='No data for selected parameters']");
    this.dateValidationMessage = page.locator(
      "//*[contains(@class,'alert-danger') or contains(@class,'invalid-feedback') or contains(@class,'text-danger')][contains(normalize-space(.),'date') or contains(normalize-space(.),'Date')]",
    );
    this.generateButton = page.locator(`${REPORT_FORM}//button[@type='submit']`);
    this.resetButton = page.locator(`${REPORT_FORM}//a[contains(@class,'btn-outline-secondary')]`);
    this.footerCells = page.locator("//table[@id='reportTable']/tfoot/tr/td");
  }

  async open(params: ReportParams = {}) {
    const query = new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)]),
    ).toString();
    await this.page.goto(query ? `${ROUTES.reports}?${query}` : ROUTES.reports);
  }

  async choosePlant(label: string) {
    await this.plantSelect.selectOption({ label });
  }

  async enterStartDate(date: string) {
    await this.startDateInput.fill(date);
  }

  async enterEndDate(date: string) {
    await this.endDateInput.fill(date);
  }

  async chooseType(label: string) {
    await this.typeSelect.selectOption({ label });
  }

  async clickGenerate() {
    await this.generateButton.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async clickReset() {
    await this.resetButton.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  kpi(label: ReportKpi): Locator {
    return this.page.locator(
      `//div[contains(@class,'card-body')][div[contains(@class,'text-muted') and normalize-space(.)='${label}']]/div[contains(@class,'fs-4')]`,
    );
  }

  async kpiValue(label: ReportKpi): Promise<number> {
    return parseNumber(await this.kpi(label).innerText());
  }

  async selectedPlantLabel(): Promise<string> {
    return this.plantSelect.evaluate((s: HTMLSelectElement) => s.selectedOptions[0]?.textContent?.trim() ?? '');
  }

  async plantOptions(): Promise<{ value: string; label: string }[]> {
    return this.plantSelect
      .locator('xpath=./option')
      .evaluateAll((opts) =>
        opts.map((o) => ({ value: (o as HTMLOptionElement).value, label: o.textContent?.trim() ?? '' })),
      );
  }

  async typeOptionLabels(): Promise<string[]> {
    return (await this.typeSelect.locator('xpath=./option').allTextContents()).map((t) => t.trim());
  }

  async readRows(): Promise<ReportRow[]> {
    const raw = await this.rows.evaluateAll((trs) =>
      trs.map((tr) => {
        const tds = Array.from(tr.querySelectorAll('td'));
        return {
          cells: tds.map((td) => (td.textContent ?? '').replace(/\s+/g, ' ').trim()),
          prClass: tds[3]?.querySelector('span')?.className ?? '',
        };
      }),
    );
    return raw.map((r) => ({
      period: r.cells[0] ?? '',
      energyKwh: parseNumber(r.cells[1] ?? ''),
      peakKw: parseNumber(r.cells[2] ?? ''),
      prPercent: parseNumber(r.cells[3] ?? ''),
      irradiance: parseNumber(r.cells[4] ?? ''),
      prClass: r.prClass,
    }));
  }

  async footerTotal(): Promise<number> {
    return parseNumber(await this.footerCells.nth(1).innerText());
  }

  chart(): Promise<ChartData> {
    return readChart(this.page, 'reportChart');
  }
}