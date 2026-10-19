import { readFileSync } from 'node:fs';
import { bar, composeBox, CONFIGURED, expect, test } from './extension';

const { version } = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string };

test('Draft reply puts a Clarification in the compose box and enables Send', async ({
  seedSettings,
  openThread,
}) => {
  await seedSettings(CONFIGURED);
  const page = await openThread('thread-clarification');

  const started = Date.now();
  await bar(page).getByRole('button', { name: 'Draft reply' }).click();

  await expect(composeBox(page)).toContainText('Hi Jordan,');
  expect(Date.now() - started).toBeLessThan(1500);
  await expect(composeBox(page)).toContainText('permanent, fixed-term or contract');
  await expect(composeBox(page)).toContainText('Sam Candidate');
  await expect(page.getByRole('button', { name: 'Send' })).toBeEnabled();
  await expect(page.locator('body')).not.toHaveAttribute('data-sent', 'true');
});

test('the button bar sits above the compose box on the messaging page', async ({ openThread }) => {
  const page = await openThread('thread-clarification');

  await expect(bar(page).getByRole('button', { name: 'Draft reply' })).toBeVisible();
});

test('Draft reply declines an Inside IR35 contract', async ({ seedSettings, openThread }) => {
  await seedSettings(CONFIGURED);
  const page = await openThread('thread-inside-ir35');

  await bar(page).getByRole('button', { name: 'Draft reply' }).click();

  await expect(composeBox(page)).toContainText('Hi Morgan,');
  await expect(composeBox(page)).toContainText("it's Inside IR35");
  await expect(composeBox(page)).toContainText('Outside IR35 contract roles');
});

test('a Thread with no job details shows a notice, and Draft anyway writes a Clarification', async ({
  seedSettings,
  openThread,
}) => {
  await seedSettings(CONFIGURED);
  const page = await openThread('thread-sales-pitch');

  await bar(page).getByRole('button', { name: 'Draft reply' }).click();
  await expect(bar(page)).toContainText('No job details detected');
  await expect(composeBox(page)).toHaveText('');

  await bar(page).getByRole('button', { name: 'Draft anyway' }).click();
  await expect(composeBox(page)).toContainText('Hi Casey,');
  await expect(composeBox(page)).toContainText('permanent, fixed-term or contract?');
  await expect(bar(page)).not.toContainText('No job details detected');
});

test("the already-replied notice shows when the Candidate's message is the latest", async ({
  seedSettings,
  openThread,
}) => {
  await seedSettings(CONFIGURED);
  const page = await openThread('thread-already-replied');

  await bar(page).getByRole('button', { name: 'Draft reply' }).click();

  await expect(bar(page)).toContainText("You've already replied. There's nothing new to answer.");
  await expect(composeBox(page)).toHaveText('');
});

test('the Draft kind menu forces a Decline, a Clarification or an Expression of Interest', async ({
  seedSettings,
  openThread,
}) => {
  await seedSettings(CONFIGURED);
  const page = await openThread('thread-already-replied');
  const force = async (label: string) => {
    await bar(page).getByRole('button', { name: 'Choose Draft kind' }).click();
    await bar(page).getByRole('menuitem', { name: label }).click();
  };

  await force('Interested');
  await expect(composeBox(page)).toContainText('full job specification');
  await expect(bar(page).getByRole('menu')).toBeHidden();

  await force('Clarify');
  await bar(page).getByRole('button', { name: 'Replace' }).click();
  await expect(composeBox(page)).toContainText('Is the role fully remote, hybrid or on-site?');

  await force('Decline');
  await bar(page).getByRole('button', { name: 'Replace' }).click();
  await expect(composeBox(page)).toContainText("Unfortunately this one isn't a fit");
});

test('an empty compose box is filled without asking', async ({ seedSettings, openThread }) => {
  await seedSettings(CONFIGURED);
  const page = await openThread('thread-inside-ir35');

  await bar(page).getByRole('button', { name: 'Draft reply' }).click();

  await expect(composeBox(page)).toContainText("it's Inside IR35");
  await expect(bar(page)).not.toContainText('Overwrite your text?');
});

test('existing text is replaced only after the Candidate confirms', async ({ seedSettings, openThread }) => {
  await seedSettings(CONFIGURED);
  const page = await openThread('thread-inside-ir35');
  let dialogs = 0;
  page.on('dialog', () => dialogs++);
  await composeBox(page).click();
  await page.keyboard.type('My own half-written reply');

  await bar(page).getByRole('button', { name: 'Draft reply' }).click();
  await expect(bar(page)).toContainText('Overwrite your text?');
  await bar(page).getByRole('button', { name: 'Cancel' }).click();
  await expect(composeBox(page)).toHaveText('My own half-written reply');
  await expect(bar(page)).not.toContainText('Overwrite your text?');

  await bar(page).getByRole('button', { name: 'Draft reply' }).click();
  await bar(page).getByRole('button', { name: 'Replace' }).click();
  await expect(composeBox(page)).toContainText("it's Inside IR35");
  await expect(composeBox(page)).not.toContainText('My own half-written reply');
  expect(dialogs).toBe(0);
});

for (const [fixture, missing] of [
  ['thread-missing-messages', 'messages'],
  ['thread-missing-name', 'recruiterName'],
  ['thread-missing-compose-box', 'composeBox'],
] as const) {
  test(`a layout change (${missing} missing) shows a notice with a content-free bug report link`, async ({
    seedSettings,
    openThread,
  }) => {
    await seedSettings(CONFIGURED);
    const page = await openThread(fixture);

    await bar(page).getByRole('button', { name: 'Draft reply' }).click();

    await expect(bar(page)).toContainText("leauto couldn't read this conversation; LinkedIn may have changed its layout.");
    const href = await bar(page).getByRole('link', { name: 'Report the problem' }).getAttribute('href');
    const report = new URL(href!);
    expect(report.origin + report.pathname).toBe('https://github.com/albal/linkedauto/issues/new');
    const body = report.searchParams.get('body')!;
    expect(body).toContain(`- Extension version: ${version}`);
    expect(body).toContain(`- Missing elements: ${missing}`);
    for (const pageContent of ['Morgan', 'Sample', 'IR35', 'government', 'linkedin.com/messaging']) {
      expect(href).not.toContain(pageContent);
    }
    if (missing !== 'composeBox') await expect(composeBox(page)).toHaveText('');
  });
}

test('the Draft kind menu closes when the Candidate clicks anywhere outside it', async ({ openThread }) => {
  const page = await openThread('thread-inside-ir35');
  const toggle = bar(page).getByRole('button', { name: 'Choose Draft kind' });
  const menu = bar(page).getByRole('menu');

  await toggle.click();
  await expect(menu).toBeVisible();
  await page.locator('.msg-title-bar').click();
  await expect(menu).toBeHidden();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');

  await toggle.click();
  await composeBox(page).click();
  await expect(menu).toBeHidden();

  await toggle.click();
  await toggle.click();
  await expect(menu).toBeHidden();
});
