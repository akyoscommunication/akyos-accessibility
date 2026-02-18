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
      if (this.options.auditOnly) {
        items.push({
          message: `Bouton répétitif sans aria-label contextuel : "${text}"`,
          fix: 'Ajoutez aria-label avec le nom du produit : aria-label="Ajouter au panier : Nom du produit".',
          element: button,
          type: 'suggestion',
          severity: 'info',
          rgaaRef: '11.1',
        });
        return;
      }
      if (productName) {
        const ariaLabel = `${text} : ${productName}`;
        button.setAttribute('aria-label', ariaLabel);
        items.push({
          message: `Bouton enrichi : ${text} (${productName})`,
          description: 'Un aria-label a été ajouté avec le nom du produit pour donner du contexte aux lecteurs d\'écran.',
          element: button,
          type: 'enhancement',
          rgaaRef: '11.1',
        });
      }
    });

    return items;
  }
}
