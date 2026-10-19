import { browser } from 'wxt/browser';
import { EMPTY_SETTINGS, type Settings } from './settings';

// Each top-level field is its own sync item, keeping every item well under the per-item quota.
const KEYS = Object.keys(EMPTY_SETTINGS) as (keyof Settings)[];

export async function loadSettings(): Promise<Settings> {
  const stored = await browser.storage.sync.get(KEYS);
  return { ...EMPTY_SETTINGS, ...stored } as Settings;
}

export async function saveSettings(settings: Settings): Promise<void> {
  await browser.storage.sync.set(settings);
}
