import { BaseEnhancer } from './BaseEnhancer.js';

/**
 * Audit des éléments obligatoires du document.
 * RGAA 8 - Éléments obligatoires, critères 8.5, 8.6.
 */
export class DocumentEnhancer extends BaseEnhancer {
  run() {
    const items = [];

    const titleEl = document.querySelector('title');
    if (!titleEl) {
      items.push({
        message: 'Aucun élément <title> dans le document',
        element: document.head || document.documentElement,
        type: 'suggestion',
        severity: 'error',
      });
    } else if (!titleEl.textContent || titleEl.textContent.trim() === '') {
      items.push({
        message: 'Élément <title> vide',
        element: titleEl,
        type: 'suggestion',
        severity: 'error',
      });
    }

    return items;
  }
}
