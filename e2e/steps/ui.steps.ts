import { expect } from '@playwright/test';
import { Then, When } from '../fixtures';

When('I click the quick-fill control for {string}', async ({ uiPage }, account: string) => {
  await uiPage.quickFillControl(account).first().click({ timeout: 5_000 });
});

Then(
  'the login form should hold username {string} and password {string}',
  async ({ uiPage }, username: string, password: string) => {
    await expect(uiPage.usernameInput).toHaveValue(username);
    await expect(uiPage.passwordInput).toHaveValue(password);
  },
);

Then('the error message should sit on the same line as its warning icon', async ({ uiPage }) => {
  const icon = await uiPage.loginErrorIcon.boundingBox();
  const message = await uiPage.loginErrorMessage.boundingBox();
  expect(icon && message, 'Both the icon and the message should be visible').toBeTruthy();
  expect(message!.y, `Message starts at y=${message!.y}, icon ends at y=${icon!.y + icon!.height}`).toBeLessThan(
    icon!.y + icon!.height,
  );
});

Then('the empty password field should not show mask dots as its placeholder', async ({ uiPage }) => {
  await expect(uiPage.passwordInput).toHaveValue('');
  const placeholder = (await uiPage.passwordInput.getAttribute('placeholder')) ?? '';
  expect(placeholder, `Placeholder "${placeholder}" looks like an entered password`).not.toMatch(/^[•●*·]+$/);
});

Then('the footer should sit below the page content', async ({ uiPage }) => {
  const footer = await uiPage.footer.boundingBox();
  const main = await uiPage.mainContent.boundingBox();
  const mainBottom = main!.y + main!.height;
  expect(footer!.y, `Footer top ${footer!.y} vs content bottom ${mainBottom}`).toBeGreaterThanOrEqual(mainBottom - 1);
});

Then(
  'the {string} text should have a contrast ratio of at least 4.5 to 1',
  async ({ uiPage }, name: string) => {
    const ratio = await uiPage.contrastRatio(uiPage.readableText(name));
    expect(ratio, `${name}: contrast ${ratio.toFixed(2)}:1 (WCAG AA needs 4.5:1)`).toBeGreaterThanOrEqual(4.5);
  },
);