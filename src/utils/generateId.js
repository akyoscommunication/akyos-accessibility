/**
 * Génère un ID unique pour éviter les collisions dans le DOM.
 * @param {string} [prefix='a11y'] - Préfixe de l'ID
 * @returns {string} ID unique
 */
export function generateId(prefix = 'a11y') {
  const random = Math.random().toString(36).slice(2, 9);
  return `${prefix}-${Date.now()}-${random}`;
}
