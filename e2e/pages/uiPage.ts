import type { Locator, Page } from '@playwright/test';

// Cross-page UI details: login form specifics, the footer, and text readability.
export class UiPage {
  readonly loginErrorIcon: Locator;
  readonly loginErrorMessage: Locator;
  readonly passwordInput: Locator;
  readonly usernameInput: Locator;
  readonly footer: Locator;
  readonly mainContent: Locator;

  private readonly readableTexts: Record<string, Locator>;

  constructor(private readonly page: Page) {
    this.loginErrorIcon = page.locator("//div[contains(@class,'alert-danger')]/i");
    this.loginErrorMessage = page.locator("//div[contains(@class,'alert-danger')]/div[1]");
    this.passwordInput = page.locator("//input[@id='passwordInput']");
    this.usernameInput = page.locator("//input[@id='usernameInput']");
    this.footer = page.locator('//footer');
    this.mainContent = page.locator('//main');

    this.readableTexts = {
      'Signed in as': page.locator("//ul[contains(@class,'dropdown-menu')]//li[contains(@class,'dropdown-header')]"),
      'Role line': page.locator("//ul[contains(@class,'dropdown-menu')]//span[starts-with(normalize-space(.),'Role:')]"),
      'Footer copyright': page.locator("//footer//span[contains(normalize-space(.),'SolarMonitor IIoT Platform')]"),
      'Navbar clock': page.locator("//span[@id='currentTime']"),
    };
  }

  quickFillControl(account: string): Locator {
    return this.page.locator(
      `//form[.//input[@id='usernameInput']]/ancestor::div[contains(@class,'card')][1]//*[self::button or self::a][contains(normalize-space(.),'${account}')]`,
    );
  }

  readableText(name: string): Locator {
    const locator = this.readableTexts[name];
    if (!locator) throw new Error(`Unknown text "${name}". Use one of: ${Object.keys(this.readableTexts).join(', ')}`);
    return locator;
  }

  // WCAG contrast ratio between an element's text colour and the first solid background behind it.
  async contrastRatio(element: Locator): Promise<number> {
    return element.evaluate((el) => {
      type Rgba = { r: number; g: number; b: number; a: number };
      const parse = (css: string): Rgba => {
        const parts = (css.match(/rgba?\(([^)]+)\)/)?.[1] ?? '0,0,0,1').split(',').map((s) => parseFloat(s));
        return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] ?? 1 };
      };
      let background: Rgba = { r: 255, g: 255, b: 255, a: 1 };
      for (let node: Element | null = el; node; node = node.parentElement) {
        const colour = parse(getComputedStyle(node).backgroundColor);
        if (colour.a > 0) {
          background = colour;
          break;
        }
      }
      const fg = parse(getComputedStyle(el).color);
      const blend = (f: number, b: number) => f * fg.a + b * (1 - fg.a);
      const text = { r: blend(fg.r, background.r), g: blend(fg.g, background.g), b: blend(fg.b, background.b) };
      const luminance = (c: { r: number; g: number; b: number }) => {
        const [r, g, b] = [c.r, c.g, c.b].map((v) => {
          const s = v / 255;
          return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const l1 = luminance(text);
      const l2 = luminance(background);
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    });
  }
}