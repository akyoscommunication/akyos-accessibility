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
        fix: 'Ajoutez un <h1> unique décrivant le contenu principal de la page.',
        element: headings[0],
        type: 'suggestion',
        severity: 'error',
        rgaaRef: '9.1',
      });
    } else if (h1s.length > 1) {
      h1s.forEach((h) => {
        items.push({
          message: `Plusieurs h1 détectés (${h1s.length} au total)`,
          fix: 'Conservez un seul <h1> par page. Transformez les autres en <h2> ou <h3>.',
          element: h,
          type: 'suggestion',
          severity: 'warning',
          rgaaRef: '9.1',
        });
      });
    }

    let prevLevel = 0;
    headings.forEach((h) => {
      const level = parseInt(h.tagName.charAt(1), 10);
      if (prevLevel > 0 && level > prevLevel + 1) {
        items.push({
          message: `Saut de niveau : h${prevLevel} suivi de h${level}`,
          fix: 'Évitez les sauts de niveau (ex. h2 → h4). Utilisez h3, h4, h5, h6 dans l\'ordre.',
          element: h,
          type: 'suggestion',
          severity: 'warning',
          rgaaRef: '9.1',
        });
      }
      if (!(h.textContent || '').trim()) {
        items.push({
          message: `Titre vide : <${h.tagName.toLowerCase()}>`,
          fix: 'Ajoutez du texte dans le titre ou supprimez l\'élément s\'il est inutile.',
          element: h,
          type: 'suggestion',
          severity: 'warning',
          rgaaRef: '9.1',
        });
      }
      prevLevel = level;
    });

    document.querySelectorAll('[role="heading"]').forEach((el) => {
      if (!el.hasAttribute('aria-level')) {
        if (this.options.auditOnly) {
          items.push({
            message: 'Élément avec role="heading" sans aria-level',
            fix: 'Ajoutez aria-level="1" à "6" selon le niveau hiérarchique : <div role="heading" aria-level="2">.</div>',
            element: el,
            type: 'suggestion',
            severity: 'warning',
            rgaaRef: '9.1',
          });
        } else {
          el.setAttribute('aria-level', '2');
          items.push({
            message: 'aria-level="2" ajouté sur role="heading"',
            description: 'L\'attribut aria-level indique le niveau hiérarchique du titre. Ajustez la valeur (1 à 6) selon la structure de votre page.',
            element: el,
            type: 'enhancement',
            rgaaRef: '9.1',
          });
        }
      }
    });

    return items;
  }
}
