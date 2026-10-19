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
  await expect(composeBox(page)).toContainText('Is the role fully remote, hybrid or on-site?');

  await force('Decline');
  await expect(composeBox(page)).toContainText("Unfortunately this one isn't a fit");
});
