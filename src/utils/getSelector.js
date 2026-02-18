/**
 * Génère un sélecteur CSS minimal pour un élément (pour export JSON / CI).
 * @param {Element} el - Élément DOM
 * @returns {string|null} Sélecteur ou null si impossible
 */
export function getSelector(el) {
  if (!el || typeof el.getAttribute !== 'function') return null;
  const id = el.getAttribute?.('id');
  if (id && /^[a-zA-Z][\w-]*$/.test(id)) return `#${id}`;
  const tag = el.tagName?.toLowerCase() || 'unknown';
  const cls = el.getAttribute?.('class');
  if (cls && cls.trim()) {
    const firstClass = cls.trim().split(/\s+/)[0];
    if (/^[a-zA-Z][\w-]*$/.test(firstClass)) return `${tag}.${firstClass}`;
  }
  return tag;
}
