import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  manifest: {
    name: 'leauto',
    description:
      'Triage recruiter pitches in LinkedIn messages and draft replies for you to review and send.',
    permissions: ['storage'],
    host_permissions: ['https://www.linkedin.com/*'],
    // Clicking the toolbar icon opens settings.
    action: { default_title: 'leauto settings' },
  },
});
