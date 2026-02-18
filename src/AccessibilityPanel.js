/**
 * Panel d'accessibilité visuelle : daltonisme et taille du texte.
 * Toujours accessible via un bouton flottant (bas-gauche).
 */

import { getDaltonizationSVG, FILTER_IDS } from './utils/daltonizationFilters.js';

const STORAGE_KEY = 'akyos-accessibility-options';
const WRAPPER_ID = 'akyos-content-filter-wrapper';
const FONT_SIZES = [90, 100, 110, 120, 130, 140, 150];
const COLORBLIND_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'protanopia', label: 'Protanopie' },
  { value: 'deuteranopia', label: 'Deutéranopie' },
  { value: 'tritanopia', label: 'Tritanopie' },
  { value: 'achromatopsia', label: 'Achromatopsie' },
];

function loadOptions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        colorblindMode: COLORBLIND_OPTIONS.some((o) => o.value === parsed.colorblindMode)
          ? parsed.colorblindMode
          : 'normal',
        fontSize: typeof parsed.fontSize === 'number' && FONT_SIZES.includes(parsed.fontSize)
          ? parsed.fontSize
          : 100,
      };
    }
  } catch (_) {}
  return { colorblindMode: 'normal', fontSize: 100 };
}

function saveOptions(options) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
  } catch (_) {}
}

function getFilterExcludedElements() {
  return new Set([
    document.getElementById('akyos-daltonization-filters'),
    document.querySelector('.akyos-a11y-toolbar-btn'),
    document.querySelector('.akyos-a11y-panel'),
    document.querySelector('.akyos-report-badge'),
    document.querySelector('.akyos-report-panel'),
  ].filter(Boolean));
}

function ensureContentWrapper() {
  let wrapper = document.getElementById(WRAPPER_ID);
  if (wrapper) return wrapper;

  wrapper = document.createElement('div');
  wrapper.id = WRAPPER_ID;
  wrapper.style.cssText = 'min-height:100vh;';

  const excluded = getFilterExcludedElements();
  const toMove = [];
  for (let i = 0; i < document.body.children.length; i++) {
    const child = document.body.children[i];
    if (!excluded.has(child)) toMove.push(child);
  }
  toMove.forEach((el) => wrapper.appendChild(el));
  document.body.insertBefore(wrapper, document.body.firstChild);
  return wrapper;
}

function removeContentWrapper() {
  const wrapper = document.getElementById(WRAPPER_ID);
  if (!wrapper) return;
  while (wrapper.firstChild) {
    document.body.insertBefore(wrapper.firstChild, wrapper);
  }
  wrapper.remove();
}

function applyFilter(mode) {
  const root = document.documentElement;
  const body = document.body;
  const wrapper = document.getElementById(WRAPPER_ID);

  if (mode === 'normal') {
    root.style.filter = '';
    body.style.filter = '';
    if (wrapper) wrapper.style.filter = '';
    removeContentWrapper();
    return;
  }

  root.style.filter = '';
  body.style.filter = '';
  if (wrapper) wrapper.style.filter = '';

  const w = ensureContentWrapper();

  if (mode === 'achromatopsia') {
    w.style.filter = 'grayscale(1) contrast(1.2)';
    return;
  }

  const filterId = FILTER_IDS[mode];
  if (filterId) {
    w.style.filter = `url(#${filterId})`;
  }
}

function applyFontSize(percent) {
  document.documentElement.style.fontSize = `${percent}%`;
}

/**
 * Affiche le panel d'accessibilité visuelle.
 */
export function renderAccessibilityPanel() {
  if (typeof document === 'undefined') return;

  injectDaltonizationSVG();
  injectStyles();

  const options = loadOptions();
  applyFilter(options.colorblindMode);
  applyFontSize(options.fontSize);

  const fontSizeIndex = FONT_SIZES.indexOf(options.fontSize);
  let currentFontSizeIndex = fontSizeIndex >= 0 ? fontSizeIndex : 1;

  const button = createButton();
  const panel = createPanel(options.colorblindMode, options.fontSize);

  button.addEventListener('click', (e) => {
    e.stopPropagation();
    panel.classList.toggle('akyos-a11y-panel--open');
    button.setAttribute('aria-expanded', panel.classList.contains('akyos-a11y-panel--open'));
  });

  document.addEventListener('click', (e) => {
    if (
      panel.classList.contains('akyos-a11y-panel--open') &&
      !panel.contains(e.target) &&
      !button.contains(e.target)
    ) {
      panel.classList.remove('akyos-a11y-panel--open');
      button.setAttribute('aria-expanded', 'false');
    }
  });

  const select = panel.querySelector('.akyos-a11y-panel__select');
  const minusBtn = panel.querySelector('.akyos-a11y-panel__font-minus');
  const plusBtn = panel.querySelector('.akyos-a11y-panel__font-plus');
  const fontValue = panel.querySelector('.akyos-a11y-panel__font-value');

  select.addEventListener('change', () => {
    const mode = select.value;
    options.colorblindMode = mode;
    applyFilter(mode);
    saveOptions(options);
  });

  minusBtn.addEventListener('click', () => {
    if (currentFontSizeIndex > 0) {
      currentFontSizeIndex--;
      const size = FONT_SIZES[currentFontSizeIndex];
      options.fontSize = size;
      applyFontSize(size);
      fontValue.textContent = `${size}%`;
      saveOptions(options);
    }
  });

  plusBtn.addEventListener('click', () => {
    if (currentFontSizeIndex < FONT_SIZES.length - 1) {
      currentFontSizeIndex++;
      const size = FONT_SIZES[currentFontSizeIndex];
      options.fontSize = size;
      applyFontSize(size);
      fontValue.textContent = `${size}%`;
      saveOptions(options);
    }
  });

  document.body.appendChild(button);
  document.body.appendChild(panel);
}

function injectDaltonizationSVG() {
  if (document.getElementById('akyos-daltonization-filters')) return;
  const div = document.createElement('div');
  div.id = 'akyos-daltonization-filters';
  div.innerHTML = getDaltonizationSVG();
  div.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;';
  document.body.insertBefore(div, document.body.firstChild);
}

function createButton() {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'akyos-a11y-toolbar-btn';
  btn.setAttribute('aria-label', 'Ouvrir les options d\'accessibilité visuelle');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </svg>
    <span class="akyos-a11y-toolbar-btn__label">Accessibilité</span>
  `;
  return btn;
}

function createPanel(colorblindMode, fontSize) {
  const panel = document.createElement('div');
  panel.className = 'akyos-a11y-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Options d\'accessibilité visuelle');

  const selectOptions = COLORBLIND_OPTIONS.map(
    (o) => `<option value="${o.value}" ${o.value === colorblindMode ? 'selected' : ''}>${o.label}</option>`
  ).join('');

  panel.innerHTML = `
    <h3 class="akyos-a11y-panel__title">Accessibilité visuelle</h3>
    <div class="akyos-a11y-panel__section">
      <label for="akyos-a11y-colorblind" class="akyos-a11y-panel__label">Type de vision</label>
      <select id="akyos-a11y-colorblind" class="akyos-a11y-panel__select">
        ${selectOptions}
      </select>
    </div>
    <div class="akyos-a11y-panel__section">
      <span class="akyos-a11y-panel__label">Taille du texte</span>
      <div class="akyos-a11y-panel__font-controls">
        <button type="button" class="akyos-a11y-panel__font-btn akyos-a11y-panel__font-minus" aria-label="Réduire la taille du texte">−</button>
        <span class="akyos-a11y-panel__font-value" aria-live="polite">${fontSize}%</span>
        <button type="button" class="akyos-a11y-panel__font-btn akyos-a11y-panel__font-plus" aria-label="Augmenter la taille du texte">+</button>
      </div>
    </div>
  `;

  return panel;
}

function injectStyles() {
  if (document.getElementById('akyos-a11y-panel-styles')) return;

  const style = document.createElement('style');
  style.id = 'akyos-a11y-panel-styles';
  style.textContent = `
    .akyos-a11y-toolbar-btn {
      position: fixed;
      bottom: 1.5rem;
      left: 1.5rem;
      z-index: 99996;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: #141416;
      border: 1px solid #27272a;
      border-radius: 10px;
      color: #fafafa;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-family: system-ui, sans-serif;
      font-size: 0.9rem;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .akyos-a11y-toolbar-btn:hover {
      transform: scale(1.02);
      box-shadow: 0 6px 16px rgba(0,0,0,0.4);
    }
    .akyos-a11y-toolbar-btn__label {
      font-weight: 500;
    }
    .akyos-a11y-panel {
      position: fixed;
      bottom: 4rem;
      left: 1.5rem;
      z-index: 99995;
      width: 280px;
      padding: 1rem 1.25rem;
      background: #141416;
      border: 1px solid #27272a;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      font-family: system-ui, sans-serif;
      opacity: 0;
      visibility: hidden;
      transform: translateY(8px);
      transition: opacity 0.2s, visibility 0.2s, transform 0.2s;
    }
    .akyos-a11y-panel.akyos-a11y-panel--open {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }
    .akyos-a11y-panel__title {
      margin: 0 0 1rem;
      font-size: 1rem;
      font-weight: 600;
      color: #fafafa;
    }
    .akyos-a11y-panel__section {
      margin-bottom: 1rem;
    }
    .akyos-a11y-panel__section:last-child {
      margin-bottom: 0;
    }
    .akyos-a11y-panel__label {
      display: block;
      margin-bottom: 0.4rem;
      font-size: 0.85rem;
      font-weight: 500;
      color: #a1a1aa;
    }
    .akyos-a11y-panel__select {
      width: 100%;
      padding: 0.5rem 0.75rem;
      font-size: 0.9rem;
      color: #fafafa;
      background: #1a1a1d;
      border: 1px solid #27272a;
      border-radius: 6px;
      cursor: pointer;
    }
    .akyos-a11y-panel__select:focus {
      outline: 2px solid #22d3ee;
      outline-offset: 2px;
    }
    .akyos-a11y-panel__font-controls {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .akyos-a11y-panel__font-btn {
      width: 36px;
      height: 36px;
      padding: 0;
      font-size: 1.25rem;
      font-weight: 600;
      line-height: 1;
      color: #fafafa;
      background: #27272a;
      border: 1px solid #3f3f46;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }
    .akyos-a11y-panel__font-btn:hover {
      background: #3f3f46;
      color: #22d3ee;
    }
    .akyos-a11y-panel__font-btn:focus {
      outline: 2px solid #22d3ee;
      outline-offset: 2px;
    }
    .akyos-a11y-panel__font-value {
      min-width: 3rem;
      font-size: 0.95rem;
      font-weight: 600;
      color: #22d3ee;
      text-align: center;
    }
  `;
  document.head.appendChild(style);
}
