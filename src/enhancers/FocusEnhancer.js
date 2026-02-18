import { BaseEnhancer } from './BaseEnhancer.js';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Audit du focus visible sur les éléments interactifs.
 * RGAA 10.7 - Focus visible.
 */
export class FocusEnhancer extends BaseEnhancer {
  run() {
    const items = [];
    const focusables = document.querySelectorAll(FOCUSABLE_SELECTOR);

    focusables.forEach((el) => {
      if (this.isHidden(el)) return;

      const style = getComputedStyle(el);
      const outlineWidth = style.outlineWidth;
      const outlineStyle = style.outlineStyle;
      const outlineColor = style.outlineColor;
      const boxShadow = style.boxShadow;

      const hasOutline = parseFloat(outlineWidth) > 0 && outlineStyle !== 'none';
      const hasBoxShadow = boxShadow && boxShadow !== 'none';

      if (!hasOutline && !hasBoxShadow) {
        const tag = el.tagName.toLowerCase();
        const text = (el.textContent || el.value || el.getAttribute('aria-label') || '').trim().substring(0, 25);
        items.push({
          message: `Focus non visible : <${tag}>${text ? ` "${text}…"` : ''}`,
          element: el,
          type: 'suggestion',
          severity: 'warning',
        });
      }
    });

    return items;
  }

  isHidden(el) {
    if (!el) return true;
    const style = getComputedStyle(el);
    return style.display === 'none' || style.visibility === 'hidden' || el.getAttribute('hidden') !== null;
  }
}
