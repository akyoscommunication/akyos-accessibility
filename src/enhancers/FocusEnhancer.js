import { BaseEnhancer } from './BaseEnhancer.js';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const FOCUS_STYLE_ID = 'akyos-focus-styles';

/**
 * Audit du focus visible sur les éléments interactifs.
 * RGAA 10.7 - Focus visible.
 * En mode enhance : injecte des styles :focus-visible si des éléments n'ont pas de focus visible.
 */
export class FocusEnhancer extends BaseEnhancer {
  run() {
    const items = [];
    const focusables = document.querySelectorAll(FOCUSABLE_SELECTOR);
    let elementsWithoutFocus = 0;

    focusables.forEach((el) => {
      if (this.isHidden(el)) return;

      const style = getComputedStyle(el);
      const outlineWidth = style.outlineWidth;
      const outlineStyle = style.outlineStyle;
      const boxShadow = style.boxShadow;

      const hasOutline = parseFloat(outlineWidth) > 0 && outlineStyle !== 'none';
      const hasBoxShadow = boxShadow && boxShadow !== 'none';

      if (!hasOutline && !hasBoxShadow) {
        elementsWithoutFocus++;
        if (this.options.auditOnly) {
          const tag = el.tagName.toLowerCase();
          const text = (el.textContent || el.value || el.getAttribute('aria-label') || '').trim().substring(0, 25);
          items.push({
            message: `Focus non visible : <${tag}>${text ? ` "${text}…"` : ''}`,
            fix: 'Ajoutez un style de focus visible en CSS : :focus { outline: 2px solid #22d3ee; outline-offset: 2px; } ou box-shadow.',
            element: el,
            type: 'suggestion',
            severity: 'warning',
            rgaaRef: '10.7',
          });
        }
      }
    });

    if (!this.options.auditOnly && elementsWithoutFocus > 0 && this.options.injectFocusStyles !== false) {
      if (!document.getElementById(FOCUS_STYLE_ID)) {
        this.injectFocusStyles();
        items.push({
          message: 'Styles de focus visibles injectés (RGAA 10.7)',
          description: 'Une feuille de style a été injectée pour afficher un contour visible (:focus-visible) sur tous les éléments interactifs lors de la navigation au clavier.',
          element: document.documentElement,
          type: 'enhancement',
          rgaaRef: '10.7',
        });
      }
    }

    return items;
  }

  injectFocusStyles() {
    const style = document.createElement('style');
    style.id = FOCUS_STYLE_ID;
    style.textContent = `
      :focus-visible {
        outline: 2px solid #22d3ee !important;
        outline-offset: 2px !important;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  isHidden(el) {
    if (!el) return true;
    const style = getComputedStyle(el);
    return style.display === 'none' || style.visibility === 'hidden' || el.getAttribute('hidden') !== null;
  }
}
