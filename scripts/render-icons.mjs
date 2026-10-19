// Renders assets/icon.svg to the PNG sizes the extension and the stores need.
// Run with `npm run icons` after changing the SVG; the PNGs are committed.
import { chromium } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const svg = await readFile('assets/icon.svg', 'utf8');
const outputs = [
  ...[16, 32, 48, 128].map((size) => ({ size, file: `public/icon/${size}.png` })),
  // Edge Add-ons store logo.
  { size: 300, file: 'assets/store/edge-logo-300.png' },
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const { size, file } of outputs) {
  await mkdir(path.dirname(file), { recursive: true });
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`,
  );
  await page.screenshot({ path: file, omitBackground: true });
  console.log(`${file} (${size}x${size})`);
}
await browser.close();
