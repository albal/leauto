import { browser } from 'wxt/browser';
import { replyTo } from '../engine/replyEngine';
import type { Notice, ReplyOptions } from '../engine/types';
import type { BackgroundMessage } from '../messages';
import {
  composeHasText,
  findComposeBox,
  findComposeForm,
  isMessagingPage,
  readThread,
  writeDraft,
  type RequiredElement,
} from '../page/adapter';
import { loadSettings } from '../settings/store';
import { BAR_HOST_ID, createButtonBar, type ButtonBar } from '../ui/buttonBar';

export default defineContentScript({
  // LinkedIn is a single-page app, so the script runs site-wide and mounts only on /messaging/.
  matches: ['https://www.linkedin.com/*'],
  main() {
    const bar: ButtonBar = createButtonBar({
      onDraftReply: () => draftReply(bar),
      onForce: (kind) => draftReply(bar, { force: kind }),
    });

    // Watches only for where to mount the bar; Thread content is read on click (ADR-0002).
    const mount = () => {
      const form = isMessagingPage(location) ? findComposeForm(document) : null;
      if (!form) {
        bar.host.remove();
        return;
      }
      if (form.previousElementSibling?.id !== BAR_HOST_ID) form.before(bar.host);
    };
    new MutationObserver(mount).observe(document.body, { childList: true, subtree: true });
    mount();
  },
});

async function draftReply(bar: ButtonBar, options: ReplyOptions = {}): Promise<void> {
  bar.clearNotice();
  const read = readThread(document);
  if (!read.ok) {
    // Never fail silently, and never write a half-built Draft.
    bar.showNotice("leauto couldn't read this conversation; LinkedIn may have changed its layout.", [
      { label: 'Report the problem', href: layoutIssueUrl(read.missing) },
    ]);
    return;
  }
  const outcome = replyTo(read.snapshot, await loadSettings(), options);
  if (outcome.type === 'notice') {
    showNotice(bar, outcome.notice);
    return;
  }
  const box = findComposeBox(document);
  if (!box) return;
  if (!composeHasText(box)) {
    writeDraft(box, outcome.text);
    return;
  }
  // Never lose the Candidate's own words without asking, and never with a blocking browser dialog.
  bar.showNotice('Overwrite your text?', [
    { label: 'Replace', onClick: () => writeDraft(box, outcome.text) },
    { label: 'Cancel', onClick: () => {} },
  ]);
}

function showNotice(bar: ButtonBar, notice: Notice): void {
  switch (notice) {
    case 'not-set-up':
      bar.showNotice('Set up your criteria before leauto can draft replies.', [
        { label: 'Open settings', onClick: () => sendToBackground({ type: 'open-options' }) },
      ]);
      break;
    case 'not-a-job':
      bar.showNotice('No job details detected, so no Draft was written.', [
        { label: 'Draft anyway', onClick: () => draftReply(bar, { force: 'clarification' }) },
      ]);
      break;
    case 'already-replied':
      bar.showNotice("You've already replied. There's nothing new to answer.");
      break;
  }
}

const ISSUES_URL = 'https://github.com/albal/leauto/issues/new';

/** A pre-filled bug report naming only the version and the missing elements: no page content. */
function layoutIssueUrl(missing: RequiredElement[]): string {
  const version = browser.runtime.getManifest().version;
  const body = [
    "leauto couldn't read a LinkedIn Thread.",
    '',
    `- Extension version: ${version}`,
    `- Missing elements: ${missing.join(', ')}`,
  ].join('\n');
  const params = new URLSearchParams({ title: `Layout changed: missing ${missing.join(', ')}`, body });
  return `${ISSUES_URL}?${params}`;
}

function sendToBackground(message: BackgroundMessage): void {
  browser.runtime.sendMessage(message);
}
