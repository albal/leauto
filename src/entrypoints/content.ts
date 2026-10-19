import { replyTo } from '../engine/replyEngine';
import { findComposeBox, findComposeForm, isMessagingPage, readThread, writeDraft } from '../page/adapter';
import { loadSettings } from '../settings/store';
import { BAR_HOST_ID, createButtonBar } from '../ui/buttonBar';

export default defineContentScript({
  // LinkedIn is a single-page app, so the script runs site-wide and mounts only on /messaging/.
  matches: ['https://www.linkedin.com/*'],
  main() {
    const bar = createButtonBar({ onDraftReply: draftReply });

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

async function draftReply(): Promise<void> {
  const read = readThread(document);
  if (!read.ok) return;
  const outcome = replyTo(read.snapshot, await loadSettings());
  if (outcome.type !== 'draft') return;
  const box = findComposeBox(document);
  if (box) writeDraft(box, outcome.text);
}
