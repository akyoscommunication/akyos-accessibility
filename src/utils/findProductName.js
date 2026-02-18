/**
 * Trouve le nom d'un produit dans le contexte DOM d'un bouton (e-commerce).
 * Remonte les parents et cherche dans les sélecteurs configurés.
 * @param {HTMLElement} element - L'élément bouton
 * @param {string[]} [selectors] - Sélecteurs CSS pour trouver le nom (ordre de priorité)
 * @returns {string|null} Le nom du produit ou null
 */
export function findProductName(element, selectors = []) {
  const defaultSelectors = [
    '.product-name',
    '.product-title',
    '.product__name',
    '.product__title',
    '[data-product-name]',
    'h2',
    'h3',
    '.card-title',
    '.item-name',
  ];

  const sel = selectors.length > 0 ? selectors : defaultSelectors;
  let parent = element.parentElement;

  while (parent && parent !== document.body) {
    for (const selector of sel) {
      try {
        const found = parent.querySelector(selector);
        if (found) {
          const text = found.getAttribute('data-product-name') || found.textContent?.trim();
          if (text && text.length > 0 && text.length < 200) {
            return text;
          }
        }
      } catch {
        // Sélecteur invalide, ignorer
      }
    }
    parent = parent.parentElement;
  }

  return null;
}
