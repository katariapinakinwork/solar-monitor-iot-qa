import type { Locator, Page } from '@playwright/test';
import { ROUTES } from '../constants/routes';

export class AlertsPage {
  readonly activeAlerts: Locator;
  private readonly antiForgeryToken: Locator;

  constructor(private readonly page: Page) {
    this.activeAlerts = page.locator("//div[@id='active-alerts-list']/div[@data-alert-id]");
    this.antiForgeryToken = page.locator("(//input[@name='__RequestVerificationToken'])[1]");
  }

  async open() {
    await this.page.goto(ROUTES.alerts);
  }

  // Active alerts whose severity badge reads Critical, Warning or Info.
  activeAlertsWithSeverity(severity: string): Locator {
    return this.page.locator(
      `//div[@id='active-alerts-list']/div[@data-alert-id][.//span[contains(@class,'badge') and normalize-space(.)='${severity}']]`,
    );
  }

  acknowledgeButtonIn(alert: Locator): Locator {
    return alert.locator("xpath=.//button[contains(normalize-space(.),'Acknowledge')]");
  }

  // The hidden security token the app expects with every form submission.
  async getAntiForgeryToken(): Promise<string> {
    return this.antiForgeryToken.inputValue();
  }
}