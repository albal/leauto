import { bar, composeBox, expect, test } from './extension';

test('first run: options open on install, Draft reply waits for setup, then uses saved settings', async ({
  context,
  optionsPage,
  openThread,
}) => {
  const optionsUrl = optionsPage.url();
  await optionsPage.close();

  const thread = await openThread('thread-clarification');
  await bar(thread).getByRole('button', { name: 'Draft reply' }).click();
  await expect(bar(thread)).toContainText('Set up your criteria');
  await expect(composeBox(thread)).toHaveText('');

  const optionsOpened = context.waitForEvent('page', (p) => p.url() === optionsUrl);
  await bar(thread).getByRole('button', { name: 'Open settings' }).click();
  const options = await optionsOpened;
  await expect(options.getByText('Your messages never leave your browser')).toBeVisible();

  await options.getByLabel('Contract', { exact: true }).check();
  await options.getByLabel('Remote', { exact: true }).check();
  await options.getByLabel('Sign-off name').fill('Robin Candidate');
  await options.getByRole('button', { name: 'Save' }).click();
  await expect(options.getByRole('status')).toHaveText('Saved.');

  await bar(thread).getByRole('button', { name: 'Draft reply' }).click();
  await expect(composeBox(thread)).toContainText('Robin Candidate');
});

test('options refuse to save an incomplete setup', async ({ optionsPage: options }) => {
  await options.getByRole('button', { name: 'Save' }).click();

  await expect(options.getByRole('status')).toContainText('choose at least one Engagement Type');
  await expect(options.getByRole('status')).toContainText('enter a sign-off name');
});

test('saved settings are shown when the options page reopens', async ({ optionsPage: options }) => {
  await options.getByLabel('Permanent').check();
  await options.getByLabel('Hybrid', { exact: true }).check();
  await options.getByLabel('Cities').fill('London\nManchester');
  await options.getByLabel('Sign-off name').fill('Robin Candidate');
  await options.getByRole('button', { name: 'Save' }).click();
  await expect(options.getByRole('status')).toHaveText('Saved.');

  await options.reload();

  await expect(options.getByLabel('Permanent')).toBeChecked();
  await expect(options.getByLabel('Cities')).toHaveValue('London\nManchester');
  await expect(options.getByLabel('Sign-off name')).toHaveValue('Robin Candidate');
});
