import type { Locator, Page } from '@playwright/test';

export class DashboardPage {
  readonly heading: Locator;

  constructor(page: Page) {
    this.heading = page.locator("//h1[contains(normalize-space(.),'Fleet Dashboard')]");
  }
}