let smoothScroll = null;
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Открыть меню');
  navigation.classList.remove('is-open');
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  navigation.classList.toggle('is-open', open);
});
navigation.addEventListener('click', event => {
  if (event.target.closest('a')) closeMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuButton.focus();
  }
});
document.addEventListener('click', event => {
  if (!event.target.closest('.header')) closeMenu();
});
window.matchMedia('(min-width: 801px)').addEventListener('change', closeMenu);
const contactForm = document.querySelector('#brief-form');
const contactInput = document.querySelector('#contact');
const contactError = document.querySelector('#contact-error');
function contactValidation(value) {
  const input = value.trim();
  if (input.includes('@')) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
  const digits = input.replace(/\D/g, '');
  return /^\+?[\d\s().-]+$/.test(input) && digits.length >= 7 && digits.length <= 15;
}
contactInput.addEventListener('input', () => {
  contactInput.setCustomValidity('');
  contactInput.removeAttribute('aria-invalid');
  contactError.hidden = true;
});
contactForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!contactValidation(contactInput.value)) {
    const message = 'Укажите корректный email или телефон (от 7 до 15 цифр).';
    contactInput.setCustomValidity(message);
    contactInput.setAttribute('aria-invalid', 'true');
    contactError.textContent = message;
    contactError.hidden = false;
    contactInput.reportValidity();
    return;
  }
  if (!document.querySelector('#name').value.trim() || !document.querySelector('#task').value.trim()) {
    contactError.textContent = 'Заполните имя и описание проекта.';
    contactError.hidden = false;
    return;
  }
  const button = contactForm.querySelector('[type="submit"]');
  const label = button.querySelector('.contact-button-label');
  if (button.disabled) return;
  button.disabled = true;
  contactForm.setAttribute('aria-busy', 'true');
  label.textContent = 'Готовим черновик…';
  contactError.hidden = true;
  // Local preparation only. A real API and consent flow must be configured separately.
  requestAnimationFrame(() => {
    let url;
    try {
      const data = new FormData(contactForm);
      const brief = `Проект для octoweb\n\nИмя: ${data.get('name')}\nКонтакт: ${data.get('contact')}\n\nО проекте:\n${data.get('task')}\n`;
      url = URL.createObjectURL(new Blob([brief], { type: 'text/plain;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'octoweb-project.txt';
      link.click();
      document.querySelector('#form-status').textContent = 'Черновик подготовлен для скачивания. Заявка не отправлена — передайте файл исполнителю самостоятельно.';
    } catch {
      contactError.textContent = 'Не удалось подготовить файл. Скопируйте описание или попробуйте ещё раз. Данные не отправлены.';
      contactError.hidden = false;
    } finally {
      if (url) setTimeout(() => URL.revokeObjectURL(url), 1000);
      button.disabled = false;
      contactForm.removeAttribute('aria-busy');
      label.textContent = 'Обсудить проект';
    }
  });
});
const contactReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if ('IntersectionObserver' in window && !contactReducedMotion.matches) {
  const contactReveal = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      contactReveal.unobserve(entry.target);
    });
  }, { threshold: .12 });
  document.querySelectorAll('.contact-copy, #brief-form').forEach(element => {
    element.classList.add('contact-reveal');
    contactReveal.observe(element);
  });
}

// Native dialog traps focus and supports Escape; the stretched button covers its card.
const applicationDialog = document.querySelector('#application-dialog');
const applicationForm = document.querySelector('#application-form');
let applicationTrigger;
let applicationOpenedWithKeyboard = false;
document.querySelectorAll('[data-plan]').forEach(button => {
  button.addEventListener('click', event => {
    applicationOpenedWithKeyboard = event.detail === 0;
    applicationTrigger = button;
    const [planName, planPrice] = button.dataset.plan.split(' — ');
    document.querySelector('#application-plan-name').textContent = planName;
    document.querySelector('#application-plan-price').textContent = planPrice;
    document.querySelector('#application-package').value = button.dataset.plan;
    document.querySelector('#application-status').textContent = 'Файл сохраняется на ваше устройство.';
    smoothScroll?.stop();
    applicationDialog.showModal();
    document.body.classList.add('dialog-open');
    applicationDialog.scrollTop = 0;
    document.querySelector('#application-name').focus({ preventScroll: true });
  });
});
document.querySelector('.dialog-close').addEventListener('click', () => applicationDialog.close());
applicationDialog.addEventListener('click', event => {
  const bounds = applicationDialog.getBoundingClientRect();
  if (event.target === applicationDialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) applicationDialog.close();
});
applicationDialog.addEventListener('close', () => {
  document.body.classList.remove('dialog-open');
  smoothScroll?.start();
  applicationTrigger?.focus({ preventScroll: true });
  if (!applicationOpenedWithKeyboard) applicationTrigger?.blur();
});
applicationForm.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(applicationForm);
  const fields = [['Тариф', 'package'], ['Имя', 'client'], ['Контакт', 'contact'], ['О проекте', 'business'], ['Задачи и функции сайта', 'goal'], ['Сроки и пожелания', 'timing']];
  const text = 'Заявка и бриф для octoweb\n\n' + fields.map(([label, key]) => `${label}: ${data.get(key) || 'Не указано'}`).join('\n\n');
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'octoweb-brief.txt';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  document.querySelector('#application-status').textContent = 'Заявка и бриф подготовлены для скачивания. Данные не отправлены.';
});

// Replay the counter on every viewport entry; rearm only after the price leaves.
const priceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const priceFormatter = new Intl.NumberFormat('ru-RU');
const runningPrices = new Map();
let priceFrame = 0;
function updatePriceFrames(now) {
  priceFrame = 0;
  runningPrices.forEach((state, element) => {
    const progress = Math.min(Math.max((now - state.started - 100) / 850, 0), 1);
    const value = Math.round((state.from + (state.to - state.from) * progress) / 50) * 50;
    // Many frames have the same rounded value: avoid redundant DOM/layout work.
    if (value !== state.lastValue) {
      element.textContent = priceFormatter.format(value);
      state.lastValue = value;
    }
    if (progress === 1) finishPrice(element);
  });
  if (runningPrices.size) priceFrame = requestAnimationFrame(updatePriceFrames);
}
function finishPrice(element) {
  runningPrices.delete(element);
  element.textContent = priceFormatter.format(Number(element.dataset.to));
}
if ('IntersectionObserver' in window && !priceMotion.matches) {
  const playedPrices = new Set();
  const priceObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const element = entry.target;
      if (!entry.isIntersecting) {
        runningPrices.delete(element);
        playedPrices.delete(element);
        element.textContent = priceFormatter.format(Number(element.dataset.from));
        return;
      }
      if (entry.intersectionRatio < 0.7 || playedPrices.has(element) || priceMotion.matches) return;
      playedPrices.add(element);
      const from = Number(element.dataset.from);
      const to = Number(element.dataset.to);
      const started = performance.now();
      element.textContent = priceFormatter.format(from);
      runningPrices.set(element, { from, to, started, lastValue: from });
      if (!priceFrame) priceFrame = requestAnimationFrame(updatePriceFrames);
    });
  }, { threshold: [0, 0.7], rootMargin: '0px' });
  document.querySelectorAll('.price-value').forEach(element => {
    element.textContent = priceFormatter.format(Number(element.dataset.from));
    priceObserver.observe(element);
  });
  priceMotion.addEventListener('change', event => {
    if (!event.matches) return;
    priceObserver.disconnect();
    document.querySelectorAll('.price-value').forEach(finishPrice);
  });
}


// One Lenis-owned RAF loop on desktop only; touch devices retain native scrolling.
const scrollDesktop = window.matchMedia('(min-width: 801px) and (hover: hover) and (pointer: fine)');
const scrollReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
function updateSmoothScroll() {
  const enabled = !document.hidden && scrollDesktop.matches && !scrollReducedMotion.matches && typeof window.Lenis === 'function';
  document.documentElement.dataset.scrollMode = enabled ? 'smooth' : 'native';
  if (!enabled) {
    smoothScroll?.destroy();
    smoothScroll = null;
    return;
  }
  if (smoothScroll) return;
  smoothScroll = new window.Lenis({
    autoRaf: true,
    // Augen Pro uses a timed easeOutQuart glide rather than lerp smoothing.
    duration: 0.8,
    lerp: 0,
    easing: progress => 1 - Math.pow(1 - progress, 4),
    smoothWheel: true,
    wheelMultiplier: 1,
    syncTouch: false,
    anchors: { offset: -32 },
    prevent: node => node.tagName === 'TEXTAREA' || node.hasAttribute('data-lenis-prevent'),
    virtualScroll: ({ event }) => !event.ctrlKey,
  });
  if (document.querySelector('dialog[open]')) smoothScroll.stop();
}
scrollDesktop.addEventListener('change', updateSmoothScroll);
scrollReducedMotion.addEventListener('change', updateSmoothScroll);
window.addEventListener('pagehide', () => {
  smoothScroll?.destroy();
  smoothScroll = null;
});
window.addEventListener('pageshow', updateSmoothScroll);
updateSmoothScroll();

// Suspend invisible work without changing any visible effect.
const stageCards = [...document.querySelectorAll('.process-card')];
const sizeBeams = entries => entries.forEach(entry => {
  const { width, height } = entry.contentRect;
  const style = getComputedStyle(entry.target);
  const w = width + parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) + 2;
  const h = height + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) + 2;
  entry.target.style.setProperty('--beam-size', `${Math.ceil(Math.hypot(w, h)) + 4}px`);
});
if ('ResizeObserver' in window) {
  const beamSizes = new ResizeObserver(sizeBeams);
  stageCards.forEach(card => beamSizes.observe(card));
}
if ('IntersectionObserver' in window) {
  const visibleStages = new IntersectionObserver(entries => entries.forEach(entry => {
    entry.target.classList.toggle('motion-visible', entry.isIntersecting);
  }), { rootMargin: '120px' });
  stageCards.forEach(card => visibleStages.observe(card));
} else stageCards.forEach(card => card.classList.add('motion-visible'));
document.addEventListener('visibilitychange', () => {
  document.documentElement.dataset.pageHidden = String(document.hidden);
  if (document.hidden) {
    cancelAnimationFrame(priceFrame);
    priceFrame = 0;
    [...runningPrices.keys()].forEach(finishPrice);
  }
  updateSmoothScroll();
});

// Forms only export local files; CSP also blocks any accidental form/network submission.
document.querySelectorAll('[data-local-export]').forEach(button => { button.disabled = false; });
document.addEventListener('octoweb:privacy-open', () => smoothScroll?.stop());
document.addEventListener('octoweb:privacy-close', () => { if (!applicationDialog.open) smoothScroll?.start(); });
