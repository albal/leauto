import type { ThreadSnapshot } from '../engine/types';

/**
 * Every LinkedIn selector lives here, so a layout change is fixed in one place.
 * Each entry lists alternatives, most semantic first.
 */
const SELECTORS = {
  thread: ['[data-view-name="message-thread"]', '.msg-thread'],
  message: ['.msg-s-event-listitem'],
  messageBody: ['.msg-s-event-listitem__body'],
  recruiterName: ['.msg-entity-lockup__entity-title', '#thread-detail-jump-target'],
  composeBox: ['[role="textbox"][contenteditable="true"]'],
  composeForm: ['form.msg-form'],
} as const;

/** The other participant's messages carry this modifier; the Candidate's don't. */
const FROM_OTHER_CLASS = 'msg-s-event-listitem--other';

/** Floating pop-up chat windows: unsupported in v1. */
const POPUP_CONTAINER = '.msg-overlay-conversation-bubble';

export type RequiredElement = 'messages' | 'recruiterName' | 'composeBox';

export type ReadResult =
  | { ok: true; snapshot: ThreadSnapshot }
  | { ok: false; missing: RequiredElement[] };

function first(root: ParentNode, selectors: readonly string[]): Element | null {
  for (const selector of selectors) {
    const found = root.querySelector(selector);
    if (found) return found;
  }
  return null;
}

function all(root: ParentNode, selectors: readonly string[]): Element[] {
  for (const selector of selectors) {
    const found = root.querySelectorAll(selector);
    if (found.length) return [...found];
  }
  return [];
}

/** True on the full-page messaging inbox, the only surface v1 supports. */
export function isMessagingPage(location: Location): boolean {
  return location.pathname.startsWith('/messaging/');
}

/** The full-page Thread's compose form, which the button bar sits above. */
export function findComposeForm(doc: Document): Element | null {
  const thread = first(doc, SELECTORS.thread);
  if (!thread) return null;
  const form = first(thread, SELECTORS.composeForm);
  return form && !form.closest(POPUP_CONTAINER) ? form : null;
}

export function findComposeBox(doc: Document): HTMLElement | null {
  const thread = first(doc, SELECTORS.thread);
  return thread ? (first(thread, SELECTORS.composeBox) as HTMLElement | null) : null;
}

/** Reads the open Thread. Call only in response to a Candidate click (ADR-0002). */
export function readThread(doc: Document): ReadResult {
  const thread = first(doc, SELECTORS.thread);
  const messageEls = thread ? all(thread, SELECTORS.message) : [];
  const nameEl = thread ? first(thread, SELECTORS.recruiterName) : null;
  const composeBox = thread ? first(thread, SELECTORS.composeBox) : null;

  const missing: RequiredElement[] = [];
  if (!messageEls.length) missing.push('messages');
  if (!nameEl) missing.push('recruiterName');
  if (!composeBox) missing.push('composeBox');
  if (missing.length) return { ok: false, missing };

  const messages = messageEls
    .map((el) => ({
      text: (first(el, SELECTORS.messageBody)?.textContent ?? '').trim(),
      fromRecruiter: el.classList.contains(FROM_OTHER_CLASS),
    }))
    .filter((m) => m.text);

  return {
    ok: true,
    snapshot: { recruiterName: nameEl?.textContent?.trim() || null, messages },
  };
}

export function composeHasText(box: HTMLElement): boolean {
  return (box.textContent ?? '').trim().length > 0;
}

/**
 * Replaces the compose box contents with `text` through native editing commands,
 * so LinkedIn's own state sees real input events and enables Send. Never sends.
 */
export function writeDraft(box: HTMLElement, text: string): void {
  box.focus();
  const selection = box.ownerDocument.getSelection();
  selection?.selectAllChildren(box);
  const doc = box.ownerDocument;
  doc.execCommand('delete');
  text.split('\n').forEach((line, i) => {
    if (i > 0) doc.execCommand('insertParagraph');
    if (line) doc.execCommand('insertText', false, line);
  });
  box.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
}
