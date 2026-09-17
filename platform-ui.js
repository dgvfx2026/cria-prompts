/* Visual adapter only. No authentication, storage, requests or prompt mutations. */
(() => {
  'use strict';
  const dialog = document.getElementById('prompt-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const title = document.getElementById('dialog-title');
  const category = document.getElementById('dialog-category');
  const reference = document.getElementById('dialog-reference');
  const text = document.getElementById('dialog-text');
  const extra = document.getElementById('dialog-extra');
  const copy = document.getElementById('dialog-copy');
  const status = document.getElementById('dialog-status');
  let sourceCard = null;
  let sourceToggle = null;
  let feedbackObserver = null;

  function syncCopyFeedback() {
    const source = sourceCard?.querySelector('.cp');
    if (!source) return;
    const copied = source.classList.contains('ok');
    const failed = source.classList.contains('err');
    copy.querySelector('span').textContent = copied ? 'Prompt copiado!' : failed ? 'Selecione o texto acima' : 'Copiar prompt';
    status.textContent = copied ? 'Prompt copiado para a área de transferência.' : failed ? 'Selecione e copie o texto completo exibido no modal.' : '';
  }

  document.addEventListener('click', event => {
    const toggle = event.target.closest('.pb-toggle');
    if (!toggle || dialog.open) return;
    const card = toggle.closest('.pc');
    const body = card?.querySelector('.pb');
    // The existing click handler owns the expanded state. Observe its result.
    if (!body?.classList.contains('expanded')) return;
    sourceCard = card;
    sourceToggle = toggle;
    title.textContent = card.querySelector('.pt')?.textContent || 'Prompt CRIA';
    category.textContent = `${card.dataset.promptType} · ${card.dataset.categoryLabel}`;
    reference.textContent = card.querySelector('.pn')?.textContent || '';
    text.textContent = body.textContent.trim();
    extra.replaceChildren();
    const customFields = card.querySelector('.cf');
    if (customFields) extra.append(customFields.cloneNode(true));
    syncCopyFeedback();
    const sourceCopy = card.querySelector('.cp');
    if (sourceCopy) {
      feedbackObserver = new MutationObserver(syncCopyFeedback);
      feedbackObserver.observe(sourceCopy, { attributes: true, attributeFilter: ['class'] });
    }
    dialog.showModal();
    dialog.querySelector('[data-dialog-close]').focus({ preventScroll: true });
  });

  copy.addEventListener('click', () => {
    // Reuse the original copy handler, including its original fallback behavior.
    sourceCard?.querySelector('.cp')?.click();
  });
  dialog.querySelector('[data-dialog-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    feedbackObserver?.disconnect();
    feedbackObserver = null;
    const returnTarget = sourceToggle;
    if (sourceCard?.querySelector('.pb.expanded')) sourceToggle?.click();
    sourceCard = null;
    sourceToggle = null;
    text.textContent = '';
    extra.replaceChildren();
    returnTarget?.focus({ preventScroll: true });
  });
})();
