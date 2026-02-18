import { BaseEnhancer } from './BaseEnhancer.js';
import { findProductName } from '../utils/findProductName.js';

const REPEATED_BUTTON_PATTERNS = [
  /ajouter\s+(au\s+)?panier/i,
  /add\s+to\s+cart/i,
  /acheter/i,
  /buy\s+now/i,
  /commander/i,
  /order\s+now/i,
];

/**
 * Améliore les boutons répétitifs (e-commerce) en ajoutant aria-label avec le contexte produit.
 */
export class ButtonEnhancer extends BaseEnhancer {
  run() {
    const buttons = document.querySelectorAll(
      'button, [role="button"], input[type="submit"], input[type="button"]'
    );
    const selectors = this.options.productNameSelectors || [];
    const enhanced = [];

    const items = [];
    buttons.forEach((button) => {
      if (button.hasAttribute('aria-label') && button.getAttribute('aria-label').length > 0) {
        return;
      }

      const text = (button.textContent || button.value || '').trim();
      if (!text) return;

      const isRepeated = REPEATED_BUTTON_PATTERNS.some((re) => re.test(text));
      if (!isRepeated) return;

      const productName = findProductName(button, selectors);
      if (productName) {
        const ariaLabel = `${text} : ${productName}`;
        button.setAttribute('aria-label', ariaLabel);
        items.push({
          message: `Bouton enrichi : ${text} (${productName})`,
          element: button,
          type: 'enhancement',
        });
      }
    });

    return items;
  }
}
