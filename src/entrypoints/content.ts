import { browser } from 'wxt/browser';
import { replyTo } from '../engine/replyEngine';
import type { Notice, ReplyOptions } from '../engine/types';
import type { BackgroundMessage } from '../messages';
import { findComposeBox, findComposeForm, isMessagingPage, readThread, writeDraft } from '../page/adapter';
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
  if (!read.ok) return;
  const outcome = replyTo(read.snapshot, await loadSettings(), options);
  if (outcome.type === 'notice') {
    showNotice(bar, outcome.notice);
    return;
  }
  const box = findComposeBox(document);
  if (box) writeDraft(box, outcome.text);
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

function sendToBackground(message: BackgroundMessage): void {
  browser.runtime.sendMessage(message);
}
