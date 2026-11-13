import type { APIResponse, Locator, Page } from '@playwright/test';
import { ROUTES } from '../constants/app';

const FILTER_FORM = "//form[.//select[@name='severity']]";

export class AlertsPage {
  readonly activeAlerts: Locator;
  readonly resolvedAlerts: Locator;
  readonly severityFilter: Locator;
  readonly plantFilter: Locator;
  readonly noActiveAlertsMessage: Locator;
  readonly successBanner: Locator;
  readonly acknowledgeWindow: Locator;
  readonly acknowledgeWindowTitle: Locator;
  readonly acknowledgeWindowAlertId: Locator;
  private readonly filterButton: Locator;
  private readonly clearLink: Locator;
  private readonly activeTab: Locator;
  private readonly resolvedTab: Locator;
  private readonly operatorNameInput: Locator;
  private readonly confirmButton: Locator;
  private readonly cancelButton: Locator;
  private readonly antiForgeryToken: Locator;

  constructor(private readonly page: Page) {
    this.activeAlerts = page.locator("//div[@id='active-alerts-list']/div[@data-alert-id]");
    this.resolvedAlerts = page.locator(
      "//div[contains(@class,'list-group-item') and contains(@class,'opacity-75')]",
    );
    this.severityFilter = page.locator("//select[@name='severity']");
    this.plantFilter = page.locator("//select[@name='plantId']");
    this.noActiveAlertsMessage = page.locator("//h5[normalize-space(.)='No active alerts']");
    this.successBanner = page.locator("//div[contains(@class,'alert-success')]");
    this.acknowledgeWindow = page.locator("//div[@id='ackModal']");
    this.acknowledgeWindowTitle = page.locator("//p[@id='ackAlertTitle']");
    this.acknowledgeWindowAlertId = page.locator("//input[@id='ackAlertId']");
    this.filterButton = page.locator(`${FILTER_FORM}//button[@type='submit']`);
    this.clearLink = page.locator(`${FILTER_FORM}//a[contains(@class,'btn-outline-secondary')]`);
    this.activeTab = page.locator("//ul[@id='alertTabs']//a[starts-with(normalize-space(.),'Active')]");
    this.resolvedTab = page.locator("//ul[@id='alertTabs']//a[starts-with(normalize-space(.),'Resolved')]");
    this.operatorNameInput = page.locator("//div[@id='ackModal']//input[@name='acknowledgedBy']");
    this.confirmButton = page.locator("//div[@id='ackModal']//button[@type='submit']");
    this.cancelButton = page.locator("//div[@id='ackModal']//button[normalize-space(.)='Cancel']");
    this.antiForgeryToken = page.locator("(//input[@name='__RequestVerificationToken'])[1]");
  }

  async open() {
    await this.page.goto(ROUTES.alerts);
  }

  // The Alerts page filtered to one plant (/Alerts?plantId=N).
  async openForPlant(plantId: number) {
    await this.page.goto(`${ROUTES.alerts}?plantId=${plantId}`);
  }

  async openResolvedTab() {
    await this.page.goto(`${ROUTES.alerts}?tab=resolved`);
  }

  // ---------- Filters and tabs ----------

  private async submitFilters() {
    await this.filterButton.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async filterBySeverity(severity: string) {
    await this.severityFilter.selectOption({ label: severity });
    await this.submitFilters();
  }

  async filterByPlant(plantName: string) {
    await this.plantFilter.selectOption({ label: plantName });
    await this.submitFilters();
  }

  async clickClear() {
    await this.clearLink.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async clickResolvedTab() {
    await this.resolvedTab.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async tabBadgeCount(tab: 'Active' | 'Resolved'): Promise<number> {
    const link = tab === 'Active' ? this.activeTab : this.resolvedTab;
    return Number((await link.locator("xpath=.//span[contains(@class,'badge')]").innerText()).trim());
  }

  // Plant names offered by the Plant filter, without "All Plants".
  async plantFilterOptions(): Promise<string[]> {
    const options = await this.plantFilter
      .locator('xpath=./option')
      .evaluateAll((opts) => opts.map((o) => ({ value: (o as HTMLOptionElement).value, label: o.textContent?.trim() ?? '' })));
    return options.filter((o) => o.value !== '').map((o) => o.label);
  }

  // Summary card count: "Active Alerts", "Critical", "Warning" or "Info".
  async summaryCount(label: string): Promise<number> {
    const value = this.page.locator(
      `//div[contains(@class,'card-body')][div[normalize-space(.)='${label}']]/div[contains(@class,'fs-3')]`,
    );
    return Number((await value.innerText()).trim());
  }

  // ---------- Reading alerts ----------

  activeAlert(id: string): Locator {
    return this.page.locator(`//div[@id='active-alerts-list']/div[@data-alert-id='${id}']`);
  }

  // Active alerts whose severity badge reads Critical, Warning or Info.
  activeAlertsWithSeverity(severity: string): Locator {
    return this.page.locator(
      `//div[@id='active-alerts-list']/div[@data-alert-id][.//span[contains(@class,'badge') and normalize-space(.)='${severity}']]`,
    );
  }

  alertTitle(alert: Locator): Locator {
    return alert.locator("xpath=.//div[contains(@class,'fw-bold')]").first();
  }

  alertPlant(alert: Locator): Locator {
    return alert.locator("xpath=.//i[contains(@class,'bi-building')]/parent::span");
  }

  alertTime(alert: Locator): Locator {
    return alert.locator("xpath=.//i[contains(@class,'bi-clock')]/parent::span");
  }

  alertType(alert: Locator): Locator {
    return alert.locator("xpath=.//i[contains(@class,'bi-tag')]/parent::span");
  }

  alertSeverityBadge(alert: Locator): Locator {
    return alert.locator("xpath=.//div[contains(@class,'flex-column')]/span[contains(@class,'badge')]");
  }

  // Severity of every active alert, top to bottom.
  async activeSeverities(): Promise<string[]> {
    return this.activeAlerts.evaluateAll((items) =>
      items.map((el) => el.querySelector('.flex-column .badge')?.textContent?.trim() ?? ''),
    );
  }

  // Plant name of every active alert, top to bottom.
  async activePlantNames(): Promise<string[]> {
    return this.activeAlerts.evaluateAll((items) =>
      items.map((el) => el.querySelector('.bi-building')?.parentElement?.textContent?.trim() ?? ''),
    );
  }

  // The resolved entry for an alert, found by its title and plant (titles alone could repeat).
  resolvedAlert(title: string, plant: string): Locator {
    return this.resolvedAlerts.filter({ hasText: title }).filter({ hasText: plant });
  }

  // ---------- Acknowledging ----------

  acknowledgeButtonIn(alert: Locator): Locator {
    return alert.locator("xpath=.//button[contains(normalize-space(.),'Acknowledge')]");
  }

  async openAcknowledgeWindow(alert: Locator) {
    await this.acknowledgeButtonIn(alert).click();
    await this.acknowledgeWindow.waitFor({ state: 'visible' });
  }

  async enterOperatorName(name: string) {
    await this.operatorNameInput.fill(name);
  }

  async confirmAcknowledge() {
    await this.confirmButton.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async cancelAcknowledge() {
    await this.cancelButton.click();
    await this.acknowledgeWindow.waitFor({ state: 'hidden' });
  }

  async acknowledge(alert: Locator, operatorName: string) {
    await this.openAcknowledgeWindow(alert);
    await this.enterOperatorName(operatorName);
    await this.confirmAcknowledge();
  }

  // Sends the acknowledge request straight to the server, skipping the UI.
  async postAcknowledge(id: string, acknowledgedBy: string, includeToken = true): Promise<APIResponse> {
    const form: Record<string, string> = { id, acknowledgedBy };
    if (includeToken) form.__RequestVerificationToken = await this.getAntiForgeryToken();
    return this.page.request.post(ROUTES.acknowledgeAlert, { form, maxRedirects: 0 });
  }

  // The hidden security token the app expects with every form submission.
  async getAntiForgeryToken(): Promise<string> {
    return this.antiForgeryToken.inputValue();
  }
}