import type { Locator, Page } from '@playwright/test';

export class NavBar {
  private readonly userMenuButton: Locator;
  private readonly signOutButton: Locator;
  private readonly brandLogo: Locator;
  private readonly menuToggle: Locator;
  readonly userName: Locator;
  readonly roleBadge: Locator;
  readonly roleLine: Locator;
  readonly highlightedLinks: Locator;

  constructor(private readonly page: Page) {
    this.userMenuButton = page.locator("//button[@id='userMenuBtn']");
    this.signOutButton = page.locator("//button[@id='logoutBtn']");
    this.brandLogo = page.locator("//a[contains(@class,'navbar-brand')]");
    this.menuToggle = page.locator("//button[contains(@class,'navbar-toggler')]");
    this.userName = page.locator("//button[@id='userMenuBtn']//span[contains(@class,'fw-semibold')]");
    this.roleBadge = page.locator("//button[@id='userMenuBtn']//span[contains(@class,'badge')]");
    this.roleLine = page.locator(
      "//ul[contains(@class,'dropdown-menu')]//span[starts-with(normalize-space(.),'Role:')]",
    );
    this.highlightedLinks = page.locator(
      "//div[@id='mainNav']//a[contains(@class,'nav-link') and contains(concat(' ',normalize-space(@class),' '),' active ')]",
    );
  }

  link(name: string): Locator {
    return this.page.locator(`//div[@id='mainNav']//a[contains(@class,'nav-link') and normalize-space(.)='${name}']`);
  }

  async clickLink(name: string) {
    await this.link(name).click();
  }

  async clickBrandLogo() {
    await this.brandLogo.click();
  }

  async openMobileMenu() {
    await this.menuToggle.click();
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