import { expect, test } from './extension';

// Evaluated inside the extension's service worker, where `chrome` exists.
declare const chrome: { runtime: { getManifest(): Record<string, unknown> } };

test('the manifest carries the store icons, a toolbar action and only the expected permissions', async ({
  serviceWorker,
}) => {
  const manifest = await serviceWorker.evaluate(() => chrome.runtime.getManifest());

  expect(manifest.icons).toEqual({ 16: 'icon/16.png', 32: 'icon/32.png', 48: 'icon/48.png', 128: 'icon/128.png' });
  expect(manifest.action).toMatchObject({ default_title: 'leauto settings' });
  expect(manifest.permissions).toEqual(['storage']);
  expect(manifest.host_permissions).toEqual(['https://www.linkedin.com/*']);
});

test('the options page links to the privacy policy', async ({ optionsPage }) => {
  await expect(optionsPage.getByRole('link', { name: 'Privacy policy' })).toHaveAttribute(
    'href',
    'https://github.com/albal/linkedauto/blob/main/PRIVACY.md',
  );
});
