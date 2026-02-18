import { exportReportToPdf } from './utils/pdfExport.js';
import { getScoreLetter } from './utils/scoreUtils.js';
import { getRgaaUrl } from './utils/rgaa.js';

const HIGHLIGHT_DURATION = 2500;

const CATEGORY_ORDER = [
  'Lang',
  'Liens externes',
  'Skip link',
  'Boutons e-commerce',
  'Formulaires',
  'Landmarks',
  'Icônes décoratives',
  'Images (audit)',
  'Titres (audit)',
  'Vidéos (audit)',
  'Cadres (audit)',
  'Tableaux (audit)',
  'Document (audit)',
  'Contraste (audit)',
  'Focus (audit)',
  'Autre',
];

const CATEGORY_LABELS = {
  Lang: 'Langue (attribut lang)',
  'Liens externes': 'Liens enrichis',
  'Skip link': 'Lien d\'évitement',
  'Boutons e-commerce': 'Boutons enrichis',
  Formulaires: 'Formulaires',
  Landmarks: 'Régions ARIA',
  'Icônes décoratives': 'Icônes décoratives',
  'Images (audit)': 'Images sans alt',
  'Titres (audit)': 'Hiérarchie des titres',
  'Vidéos (audit)': 'Vidéos sans sous-titres',
  'Cadres (audit)': 'Cadres sans titre',
  'Tableaux (audit)': 'Tableaux',
  'Document (audit)': 'Document',
  'Contraste (audit)': 'Contraste',
  'Focus (audit)': 'Focus visible',
  Autre: 'Autre',
};

function getCategoryLabel(source) {
  return CATEGORY_LABELS[source] || source;
}

function groupBySource(items) {
  const groups = {};
  items.forEach((item) => {
    const source = item.source || 'Autre';
    if (!groups[source]) groups[source] = [];
    groups[source].push(item);
  });
  return groups;
}

function getSortedGroups(enhGroups, suggGroups, confGroups = {}) {
  const all = [];
  CATEGORY_ORDER.forEach((source) => {
    if (confGroups[source]) {
      all.push({ source, items: confGroups[source], type: 'conformant', icon: '✓' });
    }
    if (enhGroups[source]) {
      all.push({ source, items: enhGroups[source], type: 'enhancement', icon: '✓' });
    }
    if (suggGroups[source]) {
      all.push({ source, items: suggGroups[source], type: 'suggestion', icon: '⚠' });
    }
  });
  [confGroups, enhGroups, suggGroups].forEach((groups, i) => {
    const type = i === 0 ? 'conformant' : i === 1 ? 'enhancement' : 'suggestion';
    const icon = type === 'suggestion' ? '⚠' : '✓';
    Object.keys(groups).forEach((source) => {
      if (!CATEGORY_ORDER.includes(source)) {
        all.push({ source, items: groups[source], type, icon });
      }
    });
  });
  return all;
}

/**
 * Affiche un rapport visuel d'accessibilité : badge score + panneau dépliable.
 */
export function render(report) {
  if (typeof document === 'undefined') return;

  const { enhancements = [], suggestions = [], score = 100 } = report;

  injectStyles();

  const badge = createBadge(score);
  const panel = createPanel(report);

  badge.addEventListener('click', () => {
    panel.classList.toggle('akyos-report--open');
  });

  document.body.appendChild(badge);
  document.body.appendChild(panel);
}

function createBadge(score) {
  const letter = getScoreLetter(score);
  const badge = document.createElement('button');
  badge.type = 'button';
  badge.className = 'akyos-report-badge';
  badge.setAttribute('aria-label', `Rapport accessibilité : ${score}% (${letter}). Cliquer pour ouvrir.`);
  badge.innerHTML = `
    <span class="akyos-report-badge__score">${score}%</span>
    <span class="akyos-report-badge__letter">${letter}</span>
  `;
  return badge;
}

function createPanel(report) {
  const { enhancements = [], suggestions = [], conformant = [], score = 100, scoreDetails = {}, mode = 'enhance' } = report;
  const letter = getScoreLetter(score);
  const panel = document.createElement('div');
  panel.className = 'akyos-report-panel';

  const enhGroups = groupBySource(enhancements);
  const suggGroups = groupBySource(suggestions);
  const confGroups = groupBySource(conformant);
  const sortedGroups = getSortedGroups(enhGroups, suggGroups, confGroups);

  const positiveCount = mode === 'audit' ? conformant.length : enhancements.length;
  const total = scoreDetails.total ?? positiveCount + suggestions.length;
  const breakdownText = total > 0
    ? `Taux de conformité : ${score}% (${positiveCount}/${total} ${mode === 'audit' ? 'points audités' : 'points traités'})`
    : (mode === 'audit' ? 'Aucun point à auditer' : 'Aucun point à traiter');

  const firstTabLabel = mode === 'audit' ? 'Conformes' : 'Améliorations';
  const firstTabCount = mode === 'audit' ? conformant.length : enhancements.length;
  const firstTabId = mode === 'audit' ? 'akyos-tab-conformant' : 'akyos-tab-enhancements';

  panel.innerHTML = `
    <div class="akyos-report-panel__header">
      <h2 class="akyos-report-panel__title">${mode === 'audit' ? 'Audit accessibilité' : 'Rapport accessibilité'}</h2>
      <div class="akyos-report-score">
        <span class="akyos-report-score__value">${score}%</span>
        <span class="akyos-report-score__letter">${letter}</span>
      </div>
      <p class="akyos-report-breakdown">${breakdownText}</p>
      <div class="akyos-report-summary">
        <span class="akyos-report-summary__item akyos-report-summary__item--enhancement">✓ ${firstTabCount}</span>
        <span class="akyos-report-summary__item akyos-report-summary__item--suggestion">⚠ ${suggestions.length}</span>
      </div>
      <div class="akyos-report-header-actions">
        <button type="button" class="akyos-report-pdf-btn" title="Exporter en PDF" aria-label="Exporter le rapport en PDF">PDF</button>
      </div>
    </div>
    <div class="akyos-report-tabs" role="tablist" aria-label="Sections du rapport">
      <button type="button" class="akyos-report-tab akyos-report-tab--active" role="tab" aria-selected="true" aria-controls="${firstTabId}" id="akyos-tab-btn-first" data-tab="first">
        ✓ ${firstTabLabel} <span class="akyos-report-tab__count">${firstTabCount}</span>
      </button>
      <button type="button" class="akyos-report-tab" role="tab" aria-selected="false" aria-controls="akyos-tab-suggestions" id="akyos-tab-btn-suggestions" data-tab="suggestions">
        ⚠ À corriger <span class="akyos-report-tab__count">${suggestions.length}</span>
      </button>
      <button type="button" class="akyos-report-tab" role="tab" aria-selected="false" aria-controls="akyos-tab-audit" id="akyos-tab-btn-audit" data-tab="audit">
        ${mode === 'audit' ? 'Audit complet' : 'Vue d\'ensemble'} <span class="akyos-report-tab__count">${enhancements.length + suggestions.length + conformant.length}</span>
      </button>
    </div>
    <div id="${firstTabId}" class="akyos-report-tabpanel" role="tabpanel" aria-labelledby="akyos-tab-btn-first">
      <div class="akyos-report-tabpanel__body"></div>
    </div>
    <div id="akyos-tab-suggestions" class="akyos-report-tabpanel akyos-report-tabpanel--hidden" role="tabpanel" aria-labelledby="akyos-tab-btn-suggestions" hidden>
      <div class="akyos-report-tabpanel__body"></div>
    </div>
    <div id="akyos-tab-audit" class="akyos-report-tabpanel akyos-report-tabpanel--hidden" role="tabpanel" aria-labelledby="akyos-tab-btn-audit" hidden>
      <div class="akyos-report-tabpanel__body"></div>
    </div>
  `;

  const enhGroupsOnly = [];
  CATEGORY_ORDER.forEach((source) => {
    if (enhGroups[source]?.length) {
      enhGroupsOnly.push({ source, items: enhGroups[source], type: 'enhancement', icon: '✓' });
    }
  });
  Object.keys(enhGroups).forEach((source) => {
    if (!CATEGORY_ORDER.includes(source) && enhGroups[source]?.length) {
      enhGroupsOnly.push({ source, items: enhGroups[source], type: 'enhancement', icon: '✓' });
    }
  });
  const confGroupsOnly = [];
  CATEGORY_ORDER.forEach((source) => {
    if (confGroups[source]?.length) {
      confGroupsOnly.push({ source, items: confGroups[source], type: 'conformant', icon: '✓' });
    }
  });
  Object.keys(confGroups).forEach((source) => {
    if (!CATEGORY_ORDER.includes(source) && confGroups[source]?.length) {
      confGroupsOnly.push({ source, items: confGroups[source], type: 'conformant', icon: '✓' });
    }
  });
  const suggGroupsOnly = [];
  CATEGORY_ORDER.forEach((source) => {
    if (suggGroups[source]?.length) {
      suggGroupsOnly.push({ source, items: suggGroups[source], type: 'suggestion', icon: '⚠' });
    }
  });
  Object.keys(suggGroups).forEach((source) => {
    if (!CATEGORY_ORDER.includes(source) && suggGroups[source]?.length) {
      suggGroupsOnly.push({ source, items: suggGroups[source], type: 'suggestion', icon: '⚠' });
    }
  });

  const tabFirst = panel.querySelector(`#${firstTabId} .akyos-report-tabpanel__body`);
  const tabSuggestions = panel.querySelector('#akyos-tab-suggestions .akyos-report-tabpanel__body');
  const tabAudit = panel.querySelector('#akyos-tab-audit .akyos-report-tabpanel__body');

  const firstTabGroups = mode === 'audit' ? confGroupsOnly : enhGroupsOnly;
  const firstTabEmptyMsg = mode === 'audit'
    ? 'Aucun point conforme détecté.'
    : 'Aucune amélioration appliquée automatiquement.';
  if (firstTabGroups.length === 0) {
    tabFirst.innerHTML = `<p class="akyos-report-empty">${firstTabEmptyMsg}</p>`;
  } else {
    firstTabGroups.forEach(({ source, items, type, icon }) => {
      tabFirst.appendChild(createCollapsibleGroup(source, items, type, icon));
    });
  }
  if (suggGroupsOnly.length === 0) {
    tabSuggestions.innerHTML = '<p class="akyos-report-empty">Aucun point à corriger manuellement.</p>';
  } else {
    suggGroupsOnly.forEach(({ source, items, type, icon }) => {
      tabSuggestions.appendChild(createCollapsibleGroup(source, items, type, icon));
    });
  }
  if (sortedGroups.length === 0) {
    tabAudit.innerHTML = `<p class="akyos-report-empty">${mode === 'audit' ? 'Aucun élément audité.' : 'Aucun élément traité.'}</p>`;
  } else {
    sortedGroups.forEach(({ source, items, type, icon }) => {
      tabAudit.appendChild(createCollapsibleGroup(source, items, type, icon));
    });
  }

  const tabs = panel.querySelectorAll('.akyos-report-tab');
  const tabpanels = panel.querySelectorAll('.akyos-report-tabpanel');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('aria-controls');
      tabs.forEach((t) => {
        t.classList.remove('akyos-report-tab--active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('akyos-report-tab--active');
      tab.setAttribute('aria-selected', 'true');
      tabpanels.forEach((p) => {
        const isActive = p.id === targetId;
        p.classList.toggle('akyos-report-tabpanel--hidden', !isActive);
        p.hidden = !isActive;
      });
    });
  });

  const pdfBtn = panel.querySelector('.akyos-report-pdf-btn');
  pdfBtn.addEventListener('click', () => {
    exportReportToPdf(report);
  });

  return panel;
}

function createCollapsibleGroup(source, items, type, icon) {
  const group = document.createElement('div');
  group.className = `akyos-report-group akyos-report-group--${type}`;
  const label = getCategoryLabel(source);
  group.innerHTML = `
    <button type="button" class="akyos-report-group__header" aria-expanded="false">
      <div class="akyos-report-group__header-row">
        <span class="akyos-report-group__icon">${icon}</span>
        <span class="akyos-report-group__count">${items.length}</span>
        <span class="akyos-report-group__chevron" aria-hidden="true"></span>
      </div>
      <span class="akyos-report-group__title">${escapeHtml(label)}</span>
    </button>
    <div class="akyos-report-group__body" hidden>
      <ul class="akyos-report-list"></ul>
    </div>
  `;

  const list = group.querySelector('.akyos-report-list');
  items.forEach((item) => {
    const li = createReportItem(item, type, icon);
    if (item.element) {
      const msg = normalizeMessage(item);
      li.querySelector('button').addEventListener('click', () => highlightElement(item.element, msg, type));
    }
    list.appendChild(li);
  });

  const header = group.querySelector('.akyos-report-group__header');
  const body = group.querySelector('.akyos-report-group__body');
  header.addEventListener('click', () => {
    const isOpen = body.hidden;
    body.hidden = !isOpen;
    header.setAttribute('aria-expanded', !isOpen);
    group.classList.toggle('akyos-report-group--open', !isOpen);
  });
  return group;
}

const SEVERITY_LABELS = { error: 'Erreur', warning: 'Avertissement', info: 'Info' };

function createReportItem(item, type, icon) {
  const li = document.createElement('li');
  const severity = item.severity || (type === 'suggestion' ? 'warning' : 'info');
  li.className = `akyos-report-item akyos-report-item--${type} akyos-report-item--${severity}`;
  const msg = normalizeMessage(item);
  const fix = item.fix;
  const description = item.description;
  const rgaaRef = item.rgaaRef || item.rgaaCriterion;
  const disabled = !item.element ? ' disabled' : '';
  const severityBadge = severity !== 'info' ? `<span class="akyos-report-item__severity" title="${SEVERITY_LABELS[severity] || severity}">${severity}</span>` : '';
  let fixBlock = '';
  if (fix && type === 'suggestion') {
    fixBlock = `<p class="akyos-report-item__fix">${escapeHtml(fix)}</p>`;
  }
  if (description && type === 'enhancement') {
    fixBlock += `<p class="akyos-report-item__description">${escapeHtml(description)}</p>`;
  }
  if (rgaaRef) {
    const rgaaUrl = getRgaaUrl(rgaaRef);
    fixBlock += `<span class="akyos-report-item__rgaa" title="Voir le critère RGAA ${escapeHtml(rgaaRef)} sur le référentiel officiel"><a href="${escapeHtml(rgaaUrl)}" target="_blank" rel="noopener noreferrer">RGAA ${escapeHtml(rgaaRef)}</a></span>`;
  }
  li.innerHTML = `
    <button type="button" class="akyos-report-item__btn"${disabled}>
      <span class="akyos-report-item__icon">${icon}</span>
      ${severityBadge}
      <span class="akyos-report-item__text">${escapeHtml(msg)}</span>
    </button>
    ${fixBlock}
  `;
  return li;
}

function normalizeMessage(item) {
  if (typeof item === 'string') return item;
  return item.message || '';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function highlightElement(element, message, type) {
  if (!element || !element.scrollIntoView) return;

  removeExistingHighlight();

  element.scrollIntoView({ behavior: 'smooth', block: 'center' });

  const isSuggestion = type === 'suggestion';
  const prevOutline = element.style.outline;
  const prevOutlineOffset = element.style.outlineOffset;
  const prevBoxShadow = element.style.boxShadow;
  const prevPosition = element.style.position;
  const prevZIndex = element.style.zIndex;

  element.style.outline = isSuggestion ? '3px solid #f59e0b' : '3px solid #22d3ee';
  element.style.outlineOffset = '4px';
  element.style.boxShadow = isSuggestion
    ? '0 0 0 6px rgba(245, 158, 11, 0.25)'
    : '0 0 0 6px rgba(34, 211, 238, 0.25)';
  element.style.position = 'relative';
  element.style.zIndex = '99996';

  const tooltip = document.createElement('div');
  tooltip.className = `akyos-highlight-tooltip akyos-highlight-tooltip--${type}`;
  tooltip.textContent = message || (isSuggestion ? 'À corriger' : 'Amélioration appliquée');
  tooltip.setAttribute('role', 'status');
  tooltip.setAttribute('aria-live', 'polite');
  document.body.appendChild(tooltip);

  positionTooltip(tooltip, element);

  const resizeObserver = new ResizeObserver(() => positionTooltip(tooltip, element));
  resizeObserver.observe(element);

  const cleanup = () => {
    element.style.outline = prevOutline;
    element.style.outlineOffset = prevOutlineOffset;
    element.style.boxShadow = prevBoxShadow;
    element.style.position = prevPosition;
    element.style.zIndex = prevZIndex;
    tooltip.remove();
    resizeObserver.disconnect();
    window.removeEventListener('scroll', updatePosition, true);
  };

  const updatePosition = () => positionTooltip(tooltip, element);
  window.addEventListener('scroll', updatePosition, true);

  setTimeout(cleanup, HIGHLIGHT_DURATION);
}

function removeExistingHighlight() {
  const existing = document.querySelector('.akyos-highlight-tooltip');
  if (existing) existing.remove();
}

function positionTooltip(tooltip, element) {
  const rect = element.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  const gap = 8;

  let top = rect.top - tooltipRect.height - gap;
  let left = rect.left + (rect.width - tooltipRect.width) / 2;

  if (top < 10) {
    top = rect.bottom + gap;
  }
  if (left < 10) left = 10;
  if (left + tooltipRect.width > window.innerWidth - 10) {
    left = window.innerWidth - tooltipRect.width - 10;
  }

  tooltip.style.top = `${top}px`;
  tooltip.style.left = `${left}px`;
}

function injectStyles() {
  if (document.getElementById('akyos-report-styles')) return;

  const style = document.createElement('style');
  style.id = 'akyos-report-styles';
  style.textContent = `
    .akyos-report-badge {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      z-index: 99998;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      padding: 0;
      background: #0a0a0b;
      border: 2px solid #22d3ee;
      border-radius: 12px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-family: system-ui, sans-serif;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .akyos-report-badge:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 16px rgba(34, 211, 238, 0.3);
    }
    .akyos-report-badge__score {
      font-size: 1rem;
      font-weight: 700;
      color: #22d3ee;
      line-height: 1.1;
    }
    .akyos-report-badge__letter {
      font-size: 0.7rem;
      font-weight: 600;
      color: #67e8f9;
    }
    .akyos-report-panel {
      position: fixed;
      bottom: 5rem;
      right: 1.5rem;
      z-index: 99997;
      width: 400px;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      background: #141416;
      border: 1px solid #27272a;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      font-family: system-ui, sans-serif;
      opacity: 0;
      visibility: hidden;
      transform: translateY(10px);
      transition: opacity 0.2s, visibility 0.2s, transform 0.2s;
    }
    .akyos-report-panel.akyos-report--open {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }
    .akyos-report-panel__header {
      flex-shrink: 0;
      position: relative;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #27272a;
    }
    .akyos-report-panel__title {
      margin: 0 0 0.5rem;
      font-size: 1rem;
      font-weight: 600;
      color: #fafafa;
    }
    .akyos-report-score {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
    }
    .akyos-report-score__value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #22d3ee;
    }
    .akyos-report-score__letter {
      font-size: 1rem;
      font-weight: 600;
      color: #67e8f9;
    }
    .akyos-report-breakdown {
      margin: 0.25rem 0 0.5rem;
      font-size: 0.8rem;
      color: #94a3b8;
    }
    .akyos-report-summary {
      display: flex;
      gap: 1rem;
      margin-top: 0.5rem;
      font-size: 0.8rem;
      color: #a1a1aa;
    }
    .akyos-report-summary__item--enhancement { color: #22c55e; }
    .akyos-report-summary__item--suggestion { color: #f59e0b; }
    .akyos-report-header-actions {
      position: absolute;
      top: 1rem;
      right: 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .akyos-report-pdf-btn {
      padding: 0.35rem 0.6rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: #22d3ee;
      background: rgba(34, 211, 238, 0.15);
      border: 1px solid rgba(34, 211, 238, 0.4);
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }
    .akyos-report-pdf-btn:hover {
      background: rgba(34, 211, 238, 0.25);
      color: #67e8f9;
    }
    .akyos-report-tabs {
      display: flex;
      flex-shrink: 0;
      gap: 0;
      padding: 0 1rem;
      border-bottom: 1px solid #27272a;
      background: #0a0a0b;
    }
    .akyos-report-tab {
      flex: 1;
      min-width: 0;
      padding: 0.6rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 500;
      color: #71717a;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      transition: color 0.15s, background 0.15s, border-color 0.15s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
    }
    .akyos-report-tab:hover {
      color: #a1a1aa;
      background: rgba(34, 211, 238, 0.05);
    }
    .akyos-report-tab--active {
      color: #22d3ee;
      border-bottom-color: #22d3ee;
    }
    .akyos-report-tab__count {
      font-size: 0.7rem;
      padding: 0.1rem 0.35rem;
      background: #27272a;
      border-radius: 4px;
      color: #a1a1aa;
    }
    .akyos-report-tab--active .akyos-report-tab__count {
      background: rgba(34, 211, 238, 0.2);
      color: #67e8f9;
    }
    .akyos-report-tabpanel {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
    }
    .akyos-report-tabpanel--hidden {
      display: none;
    }
    .akyos-report-tabpanel__body {
      padding: 0.75rem 1rem;
    }
    .akyos-report-empty {
      margin: 0;
      padding: 1.5rem 0;
      font-size: 0.85rem;
      color: #71717a;
      text-align: center;
    }
    .akyos-report-group {
      margin-bottom: 0.5rem;
      border: 1px solid #27272a;
      border-radius: 8px;
      overflow: hidden;
    }
    .akyos-report-group:last-child {
      margin-bottom: 0;
    }
    .akyos-report-group__header {
      display: block;
      width: 100%;
      padding: 0.6rem 0.75rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: #a1a1aa;
      background: #1a1a1d;
      border: none;
      cursor: pointer;
      text-align: left;
      transition: background 0.15s, color 0.15s;
    }
    .akyos-report-group__header-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.25rem;
    }
    .akyos-report-group__header:hover {
      background: #27272a;
      color: #fafafa;
    }
    .akyos-report-group--open .akyos-report-group__header {
      border-bottom: 1px solid #27272a;
    }
    .akyos-report-group__icon {
      flex-shrink: 0;
      font-size: 0.9rem;
    }
    .akyos-report-group--enhancement .akyos-report-group__icon,
    .akyos-report-group--conformant .akyos-report-group__icon { color: #22c55e; }
    .akyos-report-group--suggestion .akyos-report-group__icon { color: #f59e0b; }
    .akyos-report-group__title {
      display: block;
      width: 100%;
      line-height: 1.3;
      word-break: break-word;
    }
    .akyos-report-group__count {
      flex-shrink: 0;
      padding: 0.15rem 0.4rem;
      font-size: 0.75rem;
      font-weight: 500;
      color: #71717a;
      background: #27272a;
      border-radius: 4px;
    }
    .akyos-report-group__chevron {
      flex-shrink: 0;
      width: 0;
      height: 0;
      border-left: 4px solid transparent;
      border-right: 4px solid transparent;
      border-top: 5px solid #71717a;
      transition: transform 0.2s;
    }
    .akyos-report-group--open .akyos-report-group__chevron {
      transform: rotate(180deg);
    }
    .akyos-report-group__body {
      background: #141416;
    }
    .akyos-report-group__body .akyos-report-list {
      padding: 0.25rem 0;
    }
    .akyos-report-group__body .akyos-report-item__btn {
      padding: 0.4rem 0.75rem;
      font-size: 0.8rem;
    }
    .akyos-report-list {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .akyos-report-item {
      margin-bottom: 0.25rem;
    }
    .akyos-report-item:last-child {
      margin-bottom: 0;
    }
    .akyos-report-item__btn {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      width: 100%;
      padding: 0.5rem 0.75rem;
      background: transparent;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      text-align: left;
      font-size: 0.85rem;
      color: #a1a1aa;
      transition: background 0.15s, color 0.15s;
    }
    .akyos-report-item__btn:not(:disabled):hover {
      background: rgba(34, 211, 238, 0.1);
      color: #fafafa;
    }
    .akyos-report-item__btn:disabled {
      cursor: default;
    }
    .akyos-report-item__icon {
      flex-shrink: 0;
      font-size: 0.9rem;
    }
    .akyos-report-item--enhancement .akyos-report-item__icon,
    .akyos-report-item--conformant .akyos-report-item__icon {
      color: #22c55e;
    }
    .akyos-report-item--suggestion .akyos-report-item__icon {
      color: #f59e0b;
    }
    .akyos-report-item__severity {
      flex-shrink: 0;
      font-size: 0.65rem;
      font-weight: 600;
      text-transform: uppercase;
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
    }
    .akyos-report-item--error .akyos-report-item__severity {
      background: rgba(239, 68, 68, 0.25);
      color: #fca5a5;
    }
    .akyos-report-item--warning .akyos-report-item__severity {
      background: rgba(245, 158, 11, 0.25);
      color: #fcd34d;
    }
    .akyos-report-item__text {
      flex: 1;
      min-width: 0;
      line-height: 1.4;
      overflow: visible;
      word-break: break-word;
    }
    .akyos-report-item__description {
      display: block;
      margin: 0.35rem 0 0 0;
      padding: 0.4rem 0.5rem;
      font-size: 0.8rem;
      color: #a1a1aa;
      background: rgba(34, 197, 94, 0.1);
      border-left: 3px solid #22c55e;
      border-radius: 0 4px 4px 0;
    }
    .akyos-report-item__rgaa {
      display: block;
      font-size: 0.65rem;
      opacity: 0.7;
      margin-top: 0.25rem;
    }
    .akyos-report-item__rgaa a {
      color: #71717a;
      text-decoration: none;
    }
    .akyos-report-item__rgaa a:hover {
      color: #a1a1aa;
      text-decoration: underline;
    }
    .akyos-report-item__fix {
      margin: 0.35rem 0 0 0;
      padding: 0.4rem 0.5rem;
      font-size: 0.75rem;
      line-height: 1.4;
      color: #94a3b8;
      background: rgba(34, 211, 238, 0.08);
      border-left: 3px solid #22d3ee;
      border-radius: 0 4px 4px 0;
      word-break: break-word;
    }
    .akyos-highlight-tooltip {
      position: fixed;
      z-index: 99999;
      max-width: 320px;
      padding: 0.5rem 0.75rem;
      font-size: 0.8rem;
      line-height: 1.4;
      color: #0a0a0b;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-family: system-ui, sans-serif;
      pointer-events: none;
      animation: akyos-tooltip-in 0.2s ease-out;
    }
    .akyos-highlight-tooltip--enhancement {
      background: #22d3ee;
      border: 1px solid #67e8f9;
    }
    .akyos-highlight-tooltip--suggestion {
      background: #f59e0b;
      border: 1px solid #fbbf24;
      color: #0a0a0b;
    }
    @keyframes akyos-tooltip-in {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
}
