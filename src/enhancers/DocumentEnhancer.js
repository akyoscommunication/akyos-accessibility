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
        fix: 'Ajoutez <title> dans le <head> : <title>Nom de la page</title>',
        element: document.head || document.documentElement,
        type: 'suggestion',
        severity: 'error',
        rgaaRef: '8.5',
      });
    } else if (!titleEl.textContent || titleEl.textContent.trim() === '') {
      items.push({
        message: 'Élément <title> vide',
        fix: 'Remplissez le contenu du <title> avec une description courte de la page.',
        element: titleEl,
        type: 'suggestion',
        severity: 'error',
        rgaaRef: '8.5',
      });
    }

    return items;
  }
}
