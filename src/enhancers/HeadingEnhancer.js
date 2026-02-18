import { BaseEnhancer } from './BaseEnhancer.js';

/**
 * Audit de la hiérarchie des titres (h1-h6).
 * Détecte : sauts de niveau, absence de h1, h1 multiples.
 * Ne modifie pas le DOM : signale uniquement dans le rapport.
 */
export class HeadingEnhancer extends BaseEnhancer {
  run() {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const items = [];

    if (headings.length === 0) return [];

    const h1s = headings.filter((h) => h.tagName === 'H1');
    if (h1s.length === 0) {
      items.push({
        message: 'Aucun h1 sur la page',
        element: headings[0],
        type: 'suggestion',
        severity: 'error',
      });
    } else if (h1s.length > 1) {
      h1s.forEach((h) => {
        items.push({
          message: `Plusieurs h1 détectés (${h1s.length} au total)`,
          element: h,
          type: 'suggestion',
          severity: 'warning',
        });
      });
    }

    let prevLevel = 0;
    headings.forEach((h) => {
      const level = parseInt(h.tagName.charAt(1), 10);
      if (prevLevel > 0 && level > prevLevel + 1) {
        items.push({
          message: `Saut de niveau : h${prevLevel} suivi de h${level}`,
          element: h,
          type: 'suggestion',
          severity: 'warning',
        });
      }
      prevLevel = level;
    });

    return items;
  }
}
