const STYLES = `
  :host { all: initial; display: block; font: 14px/1.4 system-ui, sans-serif; }
  .bar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; padding: 6px 12px; }
  button {
    font: inherit; cursor: pointer; border-radius: 16px; padding: 4px 12px;
    border: 1px solid #0a66c2; background: #fff; color: #0a66c2;
  }
  button.primary { background: #0a66c2; color: #fff; }
  .notice { color: #444; }
`;

export const BAR_HOST_ID = 'leauto-button-bar';

export interface ButtonBar {
  host: HTMLElement;
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
    </div>`;
  root.querySelector('[data-action="draft-reply"]')!.addEventListener('click', handlers.onDraftReply);
  return { host };
}
