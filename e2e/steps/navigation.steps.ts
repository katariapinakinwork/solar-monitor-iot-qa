import { expect } from '@playwright/test';
import { Given, Then, When } from '../fixtures/index';

Given('the browser window is {int} pixels wide', async ({ page }, width: number) => {
  await page.setViewportSize({ width, height: 844 });
});

When('I click the {string} link in the navigation bar', async ({ navBar }, name: string) => {
  await navBar.clickLink(name);
});

When('I click the SolarMonitor logo', async ({ navBar }) => {
  await navBar.clickBrandLogo();
});

When('I open the navigation menu', async ({ navBar }) => {
  await navBar.openMobileMenu();
});

When('I click View Details on {string}', async ({ plantsPage }, plantName: string) => {
  await plantsPage.clickViewDetailsOf(plantName);
});

When('I click {string} in the breadcrumb', async ({ plantDetailPage }, name: string) => {
  await plantDetailPage.clickBreadcrumb(name);
});

Then('only the {string} link should be highlighted in the navigation bar', async ({ navBar }, name: string) => {
  await expect(navBar.highlightedLinks).toHaveCount(1);
  await expect(navBar.highlightedLinks).toHaveText(name);
});

Then('the {string} link should be hidden in the navigation bar', async ({ navBar }, name: string) => {
  await expect(navBar.link(name)).toBeHidden();
});

Then('opening {string} should return status {int}', async ({ page }, path: string, status: number) => {
  const response = await page.goto(path);
  expect(response?.status()).toBe(status);
});