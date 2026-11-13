import { Before, After } from '../fixtures';

Before({ tags: '@bug' }, async ({ context, $testInfo }) => {
  if (process.env.SHOW_BUG_FAILURES !== '1') {
    $testInfo.fail();
  }
  await context.clearCookies();
});

// After every scenario: if it failed, record which page it was on.
After(async ({ page, $testInfo }) => {
  if ($testInfo.status !== $testInfo.expectedStatus) {
    await $testInfo.attach('page-url-at-failure', {
      body: page.url(),
      contentType: 'text/plain',
    });
  }
});

