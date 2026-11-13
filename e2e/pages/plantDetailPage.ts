import type { Page } from '@playwright/test';

export class PlantDetailPage {
  constructor(private readonly page: Page) {}

  async open(id: number) {
    await this.page.goto(`/Plants/Detail/${id}`);
  }

  async clickBreadcrumb(name: string) {
    await this.page.locator(`//nav[@aria-label='breadcrumb']//a[normalize-space(.)='${name}']`).click();
  }
}