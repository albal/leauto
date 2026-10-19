const STYLES = `
  :host { all: initial; display: block; font: 14px/1.4 system-ui, sans-serif; color: #1d1d1d; }
  .bar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; padding: 6px 12px; }
  button {
    font: inherit; cursor: pointer; border-radius: 16px; padding: 4px 12px;
    border: 1px solid #0a66c2; background: #fff; color: #0a66c2;
  }
  button.primary { background: #0a66c2; color: #fff; }
  .notice { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .notice:empty { display: none; }
  .notice p { margin: 0; }
  a { color: #0a66c2; }
`;

export const BAR_HOST_ID = 'leauto-button-bar';

export interface NoticeAction {
  label: string;
  onClick(): void;
}

export interface ButtonBar {
  host: HTMLElement;
  /** Shows a message with optional actions, replacing any earlier notice. */
  showNotice(message: string, actions?: NoticeAction[]): void;
  clearNotice(): void;
}

export interface ButtonBarHandlers {
  onDraftReply(): void;
}

/** leauto's controls, isolated in a shadow root so LinkedIn's styles don't leak in. */
export function createButtonBar(handlers: ButtonBarHandlers): ButtonBar {
  const host = document.createElement('div');
  host.id = BAR_HOST_ID;
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>${STYLES}</style>
    <div class="bar">
      <button class="primary" data-action="draft-reply">Draft reply</button>
      <div class="notice" role="status"></div>
    </div>`;
  const notice = root.querySelector<HTMLElement>('.notice')!;
  root.querySelector('[data-action="draft-reply"]')!.addEventListener('click', handlers.onDraftReply);

  const clearNotice = () => notice.replaceChildren();
  return {
    host,
    clearNotice,
    showNotice(message, actions = []) {
      const text = document.createElement('p');
      text.textContent = message;
      const buttons = actions.map(({ label, onClick }) => {
        const button = document.createElement('button');
        button.textContent = label;
        button.addEventListener('click', () => {
          clearNotice();
          onClick();
        });
        return button;
      });
      notice.replaceChildren(text, ...buttons);
    },
  };
}
