import type { Locator, Page } from '@playwright/test';
import { ROUTES } from '../constants/app';

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

  // The Alerts page filtered to one plant (/Alerts?plantId=N).
  async openForPlant(plantId: number) {
    await this.page.goto(`${ROUTES.alerts}?plantId=${plantId}`);
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

// Summary card count: "Active Alerts", "Critical", "Warning" or "Info".
  async summaryCount(label: string): Promise<number> {
    const value = this.page.locator(
      `//div[contains(@class,'card-body')][div[normalize-space(.)='${label}']]/div[contains(@class,'fs-3')]`,
    );
    return Number((await value.innerText()).trim());
  }
}