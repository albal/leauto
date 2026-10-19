import { bar, composeBox, CONFIGURED, expect, test } from './extension';

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
