import { BaseEnhancer } from './BaseEnhancer.js';
import {
  parseColor,
  getLuminance,
  getContrastRatio,
  meetsContrastRequirement,
} from '../utils/contrast.js';

/**
 * Audit du contraste texte/arrière-plan.
 * RGAA 3.2 - Contraste.
 */
export class ContrastEnhancer extends BaseEnhancer {
  run() {
    const items = [];
    const textElements = this.getTextElements();

    textElements.forEach((el) => {
      const style = getComputedStyle(el);
      const color = parseColor(style.color);
      let bgColor = parseColor(style.backgroundColor);

      if (!color) return;
      if (!bgColor || style.backgroundColor === 'rgba(0, 0, 0, 0)') {
        bgColor = this.getBackgroundColor(el.parentElement);
      }
      if (!bgColor) return;

      const lum1 = getLuminance(...color);
      const lum2 = getLuminance(...bgColor);
      const ratio = getContrastRatio(lum1, lum2);

      const fontSize = parseFloat(style.fontSize) || 16;
      const fontWeight = parseInt(style.fontWeight, 10) || 400;
      const isBold = fontWeight >= 600 || style.fontWeight === 'bold';

      if (!meetsContrastRequirement(ratio, fontSize, isBold)) {
        const text = el.textContent?.trim().substring(0, 30) || '';
        items.push({
          message: `Contraste insuffisant (${ratio.toFixed(1)}:1) : ${text}${(el.textContent?.trim().length || 0) > 30 ? '…' : ''}`,
          element: el,
          type: 'suggestion',
          severity: 'warning',
        });
      }
    });

    return items;
  }

  getTextElements() {
    const selector = 'p, h1, h2, h3, h4, h5, h6, span, a, li, td, th, label, figcaption, blockquote';
    const candidates = document.querySelectorAll(selector);
    const elements = [];

    candidates.forEach((el) => {
      if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;
      const text = (el.textContent || '').trim();
      if (text.length === 0) return;
      const hasOnlyTextChildren = !el.querySelector(selector);
      if (hasOnlyTextChildren || el.childElementCount === 0) {
        elements.push(el);
      }
    });

    return elements;
  }

  getBackgroundColor(el) {
    while (el && el !== document.body) {
      const style = getComputedStyle(el);
      const bg = parseColor(style.backgroundColor);
      if (bg && style.backgroundColor !== 'rgba(0, 0, 0, 0)') return bg;
      el = el.parentElement;
    }
    return parseColor(getComputedStyle(document.body).backgroundColor) || [255, 255, 255];
  }
}
