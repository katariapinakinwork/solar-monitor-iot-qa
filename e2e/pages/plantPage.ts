import type { Locator, Page } from '@playwright/test';
import { ROUTES } from '../constants/app';
import type { PlantCard } from '../types/plant';
import { parseNumber } from '../utils/number';

export interface PlantFilters {
  search?: string;
  status?: string;
  region?: string;
}

export class PlantsPage {
  readonly heading: Locator;
  readonly plantCards: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.locator("//h1[contains(normalize-space(.),'Solar Plants')]");
    this.plantCards = page.locator("//div[contains(@class,'plant-card')]");
  }

  async open(filters: PlantFilters = {}) {
    const query = new URLSearchParams(
      Object.entries(filters).filter(([, value]) => value !== undefined) as [string, string][],
    ).toString();
    await this.page.goto(query ? `${ROUTES.plants}?${query}` : ROUTES.plants);
  }

  async readCards(): Promise<PlantCard[]> {
    const cards: PlantCard[] = [];
    const count = await this.plantCards.count();

    for (let i = 0; i < count; i++) {
      const card = this.plantCards.nth(i);
      const metrics = card.locator("xpath=.//div[contains(@class,'metric-box')]/div[contains(@class,'fw-bold')]");
      const alertBox = card.locator("xpath=.//div[contains(@class,'alert-danger')]");
      const href =
        (await card.locator("xpath=.//a[contains(normalize-space(.),'View Details')]").getAttribute('href')) ?? '';

      cards.push({
        id: Number(href.split('/').pop()),
        name: (await card.locator('xpath=.//h6').innerText()).trim(),
        status: (await card.locator("xpath=.//span[contains(@class,'badge')]").first().innerText()).trim(),
        capacityKw: parseNumber(await metrics.nth(0).innerText()),
        todayKwh: parseNumber(await metrics.nth(1).innerText()),
        activeAlerts: (await alertBox.count()) > 0 ? parseNumber(await alertBox.innerText()) : 0,
      });
    }
    return cards;
  }

  async clickViewDetailsOf(plantName: string) {
    await this.page
      .locator(
        `//div[contains(@class,'plant-card')][.//h6[normalize-space(.)='${plantName}']]//a[contains(normalize-space(.),'View Details')]`,
      )
      .click();
  }
}