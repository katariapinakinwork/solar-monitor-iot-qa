import type { Locator, Page } from '@playwright/test';

export class NavBar {
  private readonly userMenuButton: Locator;
  private readonly signOutButton: Locator;
  readonly userName: Locator;
  readonly roleBadge: Locator;

  constructor(page: Page) {
    this.userMenuButton = page.locator("//button[@id='userMenuBtn']");
    this.signOutButton = page.locator("//button[@id='logoutBtn']");
    this.userName = page.locator("//button[@id='userMenuBtn']//span[contains(@class,'fw-semibold')]");
    this.roleBadge = page.locator("//button[@id='userMenuBtn']//span[contains(@class,'badge')]");
  }

  async openUserMenu() {
    await this.userMenuButton.click();
  }

  async clickSignOut() {
    await this.signOutButton.click();
  }

  async signOut() {
    await this.openUserMenu();
    await this.clickSignOut();
  }
}