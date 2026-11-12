import { expect } from '@playwright/test';
import { Given, When } from '../fixtures';
import { getUser } from '../test-data/login';

Given('I am on the login page', async ({ loginPage }) => {
  await loginPage.open();
});

Given('I am signed in as {string}', async ({ loginPage, dashboardPage }, role: string) => {
  const user = getUser(role);
  await loginPage.open();
  await loginPage.signIn(user.username, user.password);
  await expect(dashboardPage.heading).toBeVisible();
});

When('I sign in as {string}', async ({ loginPage }, role: string) => {
  const user = getUser(role);
  await loginPage.signIn(user.username, user.password);
});

When('I sign in as {string} using the email address', async ({ loginPage }, role: string) => {
  const user = getUser(role);
  await loginPage.signIn(user.email, user.password);
});

When('I sign in as {string} with Keep me signed in ticked', async ({ loginPage }, role: string) => {
  const user = getUser(role);
  await loginPage.enterUsername(user.username);
  await loginPage.enterPassword(user.password);
  await loginPage.tickKeepSignedIn();
  await loginPage.clickSignIn();
});

When(
  'I sign in with username {string} and password {string}',
  async ({ loginPage }, username: string, password: string) => {
    await loginPage.signIn(username, password);
  },
);