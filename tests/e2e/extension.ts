import { test as base, chromium, type BrowserContext, type Page, type Worker } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { EMPTY_SETTINGS, type Settings } from '../../src/settings/settings';

// Evaluated inside the extension's service worker, where `chrome` exists.
declare const chrome: { storage: { sync: { set(items: object): Promise<void> } } };

const EXTENSION_PATH = path.resolve('.output/chrome-mv3');
const FIXTURES = path.resolve('tests/fixtures');

/** Settings for a Candidate who has finished setup. */
export const CONFIGURED: Settings = {
  ...EMPTY_SETTINGS,
  setupComplete: true,
  engagementTypes: ['Contract'],
  ir35: { enabled: true, accepted: ['Outside'] },
  workingPatterns: ['Remote'],
  rates: { currency: 'GBP', preferredDayRate: 650, minimumDayRate: 600, hoursPerDay: 7.5 },
  signOff: 'Sam Candidate',
};

interface ExtensionFixtures {
  context: BrowserContext;
  serviceWorker: Worker;
  extensionId: string;
  seedSettings(settings: Settings): Promise<void>;
  openThread(fixture: string): Promise<Page>;
}

export const test = base.extend<ExtensionFixtures>({
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      args: [`--disable-extensions-except=${EXTENSION_PATH}`, `--load-extension=${EXTENSION_PATH}`],
    });
    // Serve fixtures in place of LinkedIn; nothing reaches the real site.
    await context.route('https://www.linkedin.com/**', async (route) => {
      const name = new URL(route.request().url()).searchParams.get('fixture');
      if (!name) return route.abort();
      await route.fulfill({
        contentType: 'text/html',
        body: await readFile(path.join(FIXTURES, `${name}.html`), 'utf8'),
      });
    });
    await use(context);
    await context.close();
  },
  serviceWorker: async ({ context }, use) => {
    const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
    await use(worker);
  },
  extensionId: async ({ serviceWorker }, use) => {
    await use(new URL(serviceWorker.url()).host);
  },
  seedSettings: async ({ serviceWorker }, use) => {
    await use(async (settings) => {
      await serviceWorker.evaluate((s) => chrome.storage.sync.set(s), settings);
    });
  },
  openThread: async ({ context }, use) => {
    await use(async (fixture) => {
      const page = await context.newPage();
      await page.goto(`https://www.linkedin.com/messaging/thread/FAKE-THREAD/?fixture=${fixture}`);
      return page;
    });
  },
});

export { expect } from '@playwright/test';

export function composeBox(page: Page) {
  return page.locator('.msg-form__contenteditable');
}

export function bar(page: Page) {
  return page.locator('#leauto-button-bar');
}
