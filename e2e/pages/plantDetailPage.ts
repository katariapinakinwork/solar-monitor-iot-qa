import type { Locator, Page } from '@playwright/test';
import { readChart, type ChartData } from '../utils/charts';
import { parseNumber } from '../utils/number';

export type PlantKpi =
  | 'kWh Today'
  | 'kWh This Month'
  | 'kW Current'
  | 'Performance Ratio'
  | 'Panels Active'
  | 'Panels Faulty';

export interface PanelRow {
  serial: string;
  model: string;
  stringGroup: string;
  efficiency: string;
  status: string;
}

export class PlantDetailPage {
  readonly title: Locator;
  readonly headerLine: Locator;
  readonly statusBadge: Locator;
  readonly alertBanner: Locator;
  readonly panelRows: Locator;
  readonly panelCountBadge: Locator;

  constructor(private readonly page: Page) {
    this.title = page.locator('//h1');
    // The grey line under the title: "Pune, Maharashtra | Commissioned May 2023 | West India"
    this.headerLine = page.locator('//h1/following-sibling::p');
    this.statusBadge = page.locator("//span[contains(@class,'badge') and contains(@class,'fs-6')]");
    this.alertBanner = page.locator(
      "//div[contains(@class,'alert-danger') and contains(normalize-space(.),'require attention')]",
    );
    this.panelRows = page.locator('//table//tbody/tr');
    this.panelCountBadge = page.locator("//span[contains(@class,'badge') and contains(normalize-space(.),'shown')]");
  }

  async open(id: number) {
    await this.page.goto(`/Plants/Detail/${id}`);
  }

  async clickBreadcrumb(name: string) {
    await this.page.locator(`//nav[@aria-label='breadcrumb']//a[normalize-space(.)='${name}']`).click();
  }

  // The value on a KPI card, found by the label underneath it.
  kpi(label: PlantKpi): Locator {
    return this.page.locator(
      `//div[contains(@class,'card-body')][div[contains(@class,'text-muted') and normalize-space(.)='${label}']]/div[contains(@class,'fs-4')]`,
    );
  }

  async kpiValue(label: PlantKpi): Promise<number> {
    return parseNumber(await this.kpi(label).innerText());
  }

  // A value from the "Plant Information" list, e.g. "Capacity", "Total Panels" or "Region".
  async info(term: string): Promise<string> {
    return (
      await this.page.locator(`//dl/dt[normalize-space(.)='${term}']/following-sibling::dd[1]`).innerText()
    ).trim();
  }

  // Reads the whole panel table in one call.
  async readPanels(): Promise<PanelRow[]> {
    const rows = await this.panelRows.evaluateAll((trs) =>
      trs.map((tr) =>
        Array.from(tr.querySelectorAll('td')).map((td) => (td.textContent ?? '').replace(/\s+/g, ' ').trim()),
      ),
    );
    return rows.map((cells) => ({
      serial: cells[0] ?? '',
      model: cells[1] ?? '',
      stringGroup: cells[2] ?? '',
      efficiency: cells[3] ?? '',
      status: cells[4] ?? '',
    }));
  }

  hourlyChart(): Promise<ChartData> {
    return readChart(this.page, 'hourlyChart');
  }

  dailyChart(): Promise<ChartData> {
    return readChart(this.page, 'dailyChart');
  }
}