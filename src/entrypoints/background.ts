import { browser } from 'wxt/browser';
import type { BackgroundMessage } from '../messages';

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') browser.runtime.openOptionsPage();
  });

  // Content scripts can't open the options page themselves.
  browser.runtime.onMessage.addListener((message: BackgroundMessage) => {
    if (message.type === 'open-options') browser.runtime.openOptionsPage();
  });
});
