import type { Locator, Page } from '@playwright/test';
import { ROUTES, type PlantStatus } from '../constants/app';
import { parseNumber } from '../utils/number';

export interface PlantCard {
  id: number;
  name: string;
  location: string;
  status: string;
  capacityKw: number;
  todayKwh: number;
  panels: number;
  commissionedYear: number;
  activeAlerts: number;
  region: string;
}

// The filter form is the only form with a "search" input. Scoping to it matters:
// the navbar also has a submit button (Sign Out) and a link to /Plants.
const FILTER_FORM = "//form[.//input[@name='search']]";

export class PlantsPage {
  readonly heading: Locator;
  readonly plantCards: Locator;
  readonly searchInput: Locator;
  readonly statusFilter: Locator;
  readonly regionFilter: Locator;
  readonly filterButton: Locator;
  readonly clearButton: Locator;
  readonly showingCount: Locator;
  readonly emptyState: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.locator("//h1[contains(normalize-space(.),'Solar Plants')]");
    this.plantCards = page.locator("//div[contains(@class,'plant-card')]");
    this.searchInput = page.locator("//input[@name='search']");
    this.statusFilter = page.locator("//select[@name='status']");
    this.regionFilter = page.locator("//select[@name='region']");
    this.filterButton = page.locator(`${FILTER_FORM}//button[@type='submit']`);
    this.clearButton = page.locator(`${FILTER_FORM}//a[contains(@class,'btn-outline-secondary')]`);
    this.showingCount = page.locator("//div[strong and starts-with(normalize-space(.),'Showing')]/strong");
    this.emptyState = page.locator("//h5[normalize-space(.)='No plants found']");
  }

  plantDetailCards(plantName: string): Locator {
    return this.page.locator(`//div[contains(@class,'plant-card')][.//h6[normalize-space(.)='${plantName}']]`);
  }

  plantDetailLinks(plantName: string): Locator {
    return this.plantDetailCards(plantName).locator("xpath=.//a[contains(normalize-space(.),'View Details')]");
  }

  plantLocation(card: Locator): Locator {
    return card.locator("xpath=.//small[contains(@class,'text-muted')]").first();
  }

  plantStatus(card: Locator): Locator {
    return card.locator("xpath=.//span[contains(@class,'badge')]").first();
  }

  plantMetrics(card: Locator): Locator {
    return card.locator("xpath=.//div[contains(@class,'metric-box')]/div[contains(@class,'fw-bold')]");
  }

  plantRegion(card: Locator): Locator {
    return card.locator("xpath=.//span[contains(@class,'bg-secondary-subtle')]");
  }

  plantAlertCount(card: Locator): Locator {
    return card.locator("xpath=.//div[contains(@class,'alert-danger')]/span");
  }

  async open(options?: { status?: PlantStatus }) {
    await this.page.goto(ROUTES.plants);
    if (options?.status) await this.filterByStatus(options.status);
  }

  // Submitting the form loads a new page; wait for it before reading anything.
  private async submitFilters() {
    await this.filterButton.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async searchPlants(search: string) {
    await this.searchInput.fill(search);
    await this.submitFilters();
  }

  async filterByStatus(status: PlantStatus) {
    await this.statusFilter.selectOption({ label: status });
    await this.submitFilters();
  }

  async filterByRegion(region: string) {
    await this.regionFilter.selectOption({ label: region });
    await this.submitFilters();
  }

  async applyFilters(search?: string, status?: PlantStatus, region?: string) {
    if (search !== undefined) await this.searchInput.fill(search);
    if (status !== undefined) await this.statusFilter.selectOption({ label: status });
    if (region !== undefined) await this.regionFilter.selectOption({ label: region });
    await this.submitFilters();
  }

  async clearFilters() {
    await this.clearButton.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async plantCount(): Promise<number> {
    return this.plantCards.count();
  }

  async getShowingCount(): Promise<number> {
    return parseNumber(await this.showingCount.innerText());
  }

  // Region names from the dropdown, without the "All Regions" option (whose value is empty).
  async getRegionOptions(): Promise<string[]> {
    const values = await this.regionFilter
      .locator('xpath=./option')
      .evaluateAll((options) => options.map((o) => (o as HTMLOptionElement).value));
    return values.filter(Boolean);
  }

  async getFilterValues() {
    return {
      search: await this.searchInput.inputValue(),
      status: await this.statusFilter.inputValue(),
      region: await this.regionFilter.inputValue(),
    };
  }

  async clickViewDetailsOf(plantName: string) {
    await this.plantDetailLinks(plantName).click();
  }

  async readCards(): Promise<PlantCard[]> {
    const cards: PlantCard[] = [];

    for (const card of await this.plantCards.all()) {
      const metrics = this.plantMetrics(card);
      const alertBox = this.plantAlertCount(card);
      const href = await card.locator("xpath=.//a[contains(normalize-space(.),'View Details')]").getAttribute('href');

      cards.push({
        id: Number(href?.split('/').pop()),
        name: (await card.locator('xpath=.//h6').innerText()).trim(),
        location: (await this.plantLocation(card).innerText()).trim(),
        status: (await this.plantStatus(card).innerText()).trim(),
        capacityKw: parseNumber(await metrics.nth(0).innerText()),
        todayKwh: parseNumber(await metrics.nth(1).innerText()),
        panels: parseNumber(await metrics.nth(2).innerText()),
        commissionedYear: parseNumber(await metrics.nth(3).innerText()),
        activeAlerts: (await alertBox.count()) > 0 ? parseNumber(await alertBox.innerText()) : 0,
        region: (await this.plantRegion(card).innerText()).trim(),
      });
    }
    return cards;
  }
}