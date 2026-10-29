(() => {
  'use strict';
  const key = 'octoweb.privacy-choice.v1';
  const version = '2026-10-29';
  const banner = document.querySelector('#cookie-banner');
  const dialog = document.querySelector('#cookie-dialog');
  if (!banner || !dialog) return;
  let trigger;
  let memoryChoice = null;
  function readChoice() {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      if (value?.version === version && ['accept', 'reject', 'custom'].includes(value.action) && value.analytics === false && value.advertising === false) return value;
    } catch { /* Blocked storage or a malformed value must not activate anything. */ }
    return memoryChoice;
  }
  function status(text) {
    document.querySelectorAll('.cookie-storage-status').forEach(node => { node.textContent = text; });
  }
  function saveChoice(action) {
    const value = { version, action, necessary: true, analytics: false, advertising: false, chosenAt: new Date().toISOString() };
    memoryChoice = value;
    let saved = false;
    try { localStorage.setItem(key, JSON.stringify(value)); saved = true; } catch { /* Page-session fallback only. */ }
    banner.hidden = true;
    status(saved ? 'Настройки сохранены. Аналитика и реклама отключены.' : 'Браузер запретил хранение. Выбор действует только на этой странице. Аналитика и реклама отключены.');
    if (!saved) {
      // Keep the storage limitation visible outside the closed settings dialog.
      const footerStatus = document.querySelector('.footer-note');
      if (footerStatus) footerStatus.textContent += ' Настройки cookie не сохранены: хранилище браузера недоступно.';
    }
    if (dialog.open) dialog.close();
  }
  document.querySelectorAll('[data-cookie-choice]').forEach(button => {
    button.addEventListener('click', () => saveChoice(button.dataset.cookieChoice));
  });
  document.querySelectorAll('[data-cookie-settings]').forEach(button => {
    button.addEventListener('click', () => {
      if (dialog.open) return;
      trigger = button;
      document.dispatchEvent(new CustomEvent('octoweb:privacy-open'));
      dialog.showModal();
      document.body.classList.add('privacy-dialog-open');
      dialog.querySelector('[data-cookie-close]').focus();
    });
  });
  dialog.querySelector('[data-cookie-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('privacy-dialog-open');
    document.dispatchEvent(new CustomEvent('octoweb:privacy-close'));
    if (trigger?.isConnected && !trigger.closest('[hidden]')) trigger.focus({ preventScroll: true });
  });
  dialog.querySelector('form').addEventListener('submit', event => {
    event.preventDefault();
    saveChoice('custom');
  });
  dialog.querySelector('[data-cookie-reset]').addEventListener('click', () => {
    memoryChoice = null;
    try { localStorage.removeItem(key); } catch { /* Nothing can be persisted. */ }
    banner.hidden = false;
    status('Сохранённый выбор удалён. Необязательные сервисы отключены.');
    dialog.close();
  });
  window.addEventListener('storage', event => { if (event.key === key || event.key === null) banner.hidden = Boolean(readChoice()); });
  banner.hidden = Boolean(readChoice());
})();
