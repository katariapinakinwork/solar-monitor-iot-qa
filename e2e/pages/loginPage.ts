import type { Locator, Page } from '@playwright/test';
import { ROUTES } from '../constants/app';

export class LoginPage {
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly keepSignedInCheckbox: Locator;
  private readonly signInButton: Locator;
  readonly errorAlert: Locator;
  readonly successAlert: Locator;

  constructor(private readonly page: Page) {
    this.usernameInput = page.locator("//input[@id='usernameInput']");
    this.passwordInput = page.locator("//input[@id='passwordInput']");
    this.keepSignedInCheckbox = page.locator("//input[@id='rememberMe']");
    this.signInButton = page.locator("//button[@id='loginBtn']");
    this.errorAlert = page.locator("//div[contains(@class,'alert-danger')]");
    this.successAlert = page.locator("//div[contains(@class,'alert-success')]");
  }

  async open() {
    await this.page.goto(ROUTES.login);
  }

  async enterUsername(username: string) {
    await this.usernameInput.fill(username);
  }

  async enterPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async tickKeepSignedIn() {
    await this.keepSignedInCheckbox.check();
  }

  async clickSignIn() {
    await this.signInButton.click();
  }

  async signIn(username: string, password: string) {
    await this.enterUsername(username);
    await this.enterPassword(password);
    await this.clickSignIn();
  }

  // True when the browser's own "required field" check blocks the empty username.
  async isUsernameFlaggedAsRequired(): Promise<boolean> {
    return this.usernameInput.evaluate((el: HTMLInputElement) => el.validity.valueMissing);
  }
}