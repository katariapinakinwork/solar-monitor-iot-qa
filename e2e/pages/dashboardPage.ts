import type { Locator, Page } from '@playwright/test';
import { ROUTES } from '../constants/app';
import { ChartData, readChart } from '../utils/charts';
import { parseNumber } from '../utils/number';

export type KpiCard = 'Total Capacity' | "Today's Generation" | 'Fleet Performance' | 'CO₂ Avoided';
export type StatusTile = 'Online' | 'Offline' | 'Maint./Degraded' | 'Critical Alerts';

// Matches an element whose class list contains exactly "card" (not "card-header" or "card-body").
const CARD = "contains(concat(' ',normalize-space(@class),' '),' card ')";

export class DashboardPage {
  readonly heading: Locator;
  readonly plantsOverviewRows: Locator;
  readonly recentAlertItems: Locator;
  private readonly viewAllPlantsLink: Locator;
  private readonly recentAlertsViewAllLink: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.locator("//h1[contains(normalize-space(.),'Fleet Dashboard')]");
    this.plantsOverviewRows = page.locator(
      `//h6[contains(normalize-space(.),'Plants Overview')]/ancestor::div[${CARD}][1]//tbody/tr`,
    );
    this.recentAlertItems = page.locator(
      `//h6[contains(normalize-space(.),'Recent Alerts')]/ancestor::div[${CARD}][1]//li[contains(@class,'list-group-item')]`,
    );
    this.viewAllPlantsLink = page.locator("//a[contains(normalize-space(.),'View All Plants')]");
    this.recentAlertsViewAllLink = page.locator(
      "//h6[contains(normalize-space(.),'Recent Alerts')]/following-sibling::a[normalize-space(.)='View all']",
    );
  }

    // Plants Overview locators
  plantCapacity(row: Locator): Locator {
    return row.locator('xpath=./td[2]');
  }

  plantStatusBadge(row: Locator): Locator {
    return row.locator("xpath=./td[3]//span[contains(@class,'badge')]");
  }

  // Recent Alerts locators
  alertSeverityBadge(item: Locator): Locator {
    return item.locator("xpath=.//span[contains(@class,'badge')]");
  }

  // Returns trimmed text to avoid whitespace/newline assertion failures.
  async trimmedText(locator: Locator): Promise<string> {
    return (await locator.textContent())?.trim() ?? '';
  }

  async open() {
    await this.page.goto(ROUTES.dashboard);
  }

  kpiCard(label: KpiCard): Locator {
    // Double quotes around the label because "Today's Generation" contains an apostrophe.
    return this.page.locator(`//div[contains(@class,'kpi-card')][.//p[normalize-space(.)="${label}"]]`);
  }

  async kpiValue(label: KpiCard): Promise<number> {
    return parseNumber(await this.kpiCard(label).locator('xpath=.//h3').innerText());
  }

  // The grey line under a KPI value, e.g. "5 plants" or "PR Ratio: 0.846".
  async kpiSubtext(label: KpiCard): Promise<string> {
    return this.kpiCard(label)
      .locator("xpath=.//small[contains(@class,'text-muted') and not(ancestor::h3)]")
      .innerText();
  }

  async statusTileCount(label: StatusTile): Promise<number> {
    const tile = this.page.locator(
      `//div[contains(@class,'rounded-3')][small[normalize-space(.)='${label}']]/div[contains(@class,'fs-2')]`,
    );
    return parseNumber(await tile.innerText());
  }

  async clickViewAllPlants() {
    await this.viewAllPlantsLink.click();
  }

  async clickRecentAlertsViewAll() {
    await this.recentAlertsViewAllLink.click();
  }

  hourlyChart(): Promise<ChartData> {
    return readChart(this.page, 'hourlyChart');
  }
}