import type { Locator, Page } from '@playwright/test';

export class AccessDeniedPage {
  readonly heading: Locator;
  readonly roleNotice: Locator;

  constructor(page: Page) {
    this.heading = page.locator("//h2[contains(normalize-space(.),'Access Denied (403)')]");
    this.roleNotice = page.locator("//div[contains(@class,'alert-warning')]");
  }
}