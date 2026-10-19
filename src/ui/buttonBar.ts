import type { DraftKind } from '../engine/types';

const STYLES = `
  :host { all: initial; display: block; font: 14px/1.4 system-ui, sans-serif; color: #1d1d1d; }
  .bar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; padding: 6px 12px; }
  button {
    font: inherit; cursor: pointer; border-radius: 16px; padding: 4px 12px;
    border: 1px solid #0a66c2; background: #fff; color: #0a66c2;
  }
  button.primary { background: #0a66c2; color: #fff; }
  .kinds { position: relative; display: inline-flex; }
  .toggle { border-radius: 0 16px 16px 0; margin-left: -9px; padding: 4px 8px; }
  .menu {
    position: absolute; bottom: calc(100% + 4px); left: 0; z-index: 1;
    display: grid; gap: 2px; padding: 4px; min-width: 140px;
    background: #fff; border: 1px solid #c8c8c8; border-radius: 8px; box-shadow: 0 2px 8px rgb(0 0 0 / 15%);
  }
  .menu[hidden] { display: none; }
  .menu button { border: 0; border-radius: 4px; text-align: left; }
  .menu button:hover, .menu button:focus-visible { background: #eef3f8; }
  .notice { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .notice:empty { display: none; }
  .notice p { margin: 0; }
  a { color: #0a66c2; }
`;

export const BAR_HOST_ID = 'leauto-button-bar';

export type NoticeAction = { label: string; onClick(): void } | { label: string; href: string };

export interface ButtonBar {
  host: HTMLElement;
  /** Shows a message with optional actions, replacing any earlier notice. */
  showNotice(message: string, actions?: NoticeAction[]): void;
  clearNotice(): void;
}

export interface ButtonBarHandlers {
  onDraftReply(): void;
  onForce(kind: DraftKind): void;
}

/** Labelled by Draft kind, never by any one Candidate's rules. */
const FORCED_KINDS: { kind: DraftKind; label: string }[] = [
  { kind: 'decline', label: 'Decline' },
  { kind: 'clarification', label: 'Clarify' },
  { kind: 'interest', label: 'Interested' },
];

/** leauto's controls, isolated in a shadow root so LinkedIn's styles don't leak in. */
export function createButtonBar(handlers: ButtonBarHandlers): ButtonBar {
  const host = document.createElement('div');
  host.id = BAR_HOST_ID;
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>${STYLES}</style>
    <div class="bar">
      <div class="kinds">
        <button class="primary" data-action="draft-reply">Draft reply</button>
        <button class="primary toggle" aria-label="Choose Draft kind" aria-haspopup="menu" aria-expanded="false">▾</button>
        <div class="menu" role="menu" hidden>
          ${FORCED_KINDS.map(({ kind, label }) => `<button role="menuitem" data-kind="${kind}">${label}</button>`).join('')}
        </div>
      </div>
      <div class="notice" role="status"></div>
    </div>`;
  const notice = root.querySelector<HTMLElement>('.notice')!;
  const toggle = root.querySelector<HTMLButtonElement>('.toggle')!;
  const menu = root.querySelector<HTMLElement>('.menu')!;
  const setMenuOpen = (open: boolean) => {
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  };

  root.querySelector('[data-action="draft-reply"]')!.addEventListener('click', handlers.onDraftReply);
  toggle.addEventListener('click', () => setMenuOpen(Boolean(menu.hidden)));
  menu.addEventListener('click', (event) => {
    const kind = (event.target as HTMLElement).dataset.kind as DraftKind | undefined;
    if (!kind) return;
    setMenuOpen(false);
    handlers.onForce(kind);
  });
  menu.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setMenuOpen(false);
      toggle.focus();
    }
  });

  const clearNotice = () => notice.replaceChildren();
  return {
    host,
    clearNotice,
    showNotice(message, actions = []) {
      const text = document.createElement('p');
      text.textContent = message;
      const buttons = actions.map((action) => {
        if ('href' in action) {
          const link = document.createElement('a');
          link.textContent = action.label;
          link.href = action.href;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          return link;
        }
        const button = document.createElement('button');
        button.textContent = action.label;
        button.addEventListener('click', () => {
          clearNotice();
          action.onClick();
        });
        return button;
      });
      notice.replaceChildren(text, ...buttons);
    },
  };
}
