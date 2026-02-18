import { BaseEnhancer } from './BaseEnhancer.js';

/**
 * Audit et amélioration des tableaux.
 * RGAA 5 - Tableaux.
 */
export class TableEnhancer extends BaseEnhancer {
  run() {
    const items = [];
    const tables = document.querySelectorAll('table');

    tables.forEach((table) => {
      const hasTh = table.querySelector('th');
      const hasCaption = table.querySelector('caption');
      const hasSummary = table.getAttribute('summary');
      const hasAriaDescribedby = table.getAttribute('aria-describedby');
      const hasThead = table.querySelector('thead');
      const hasTfoot = table.querySelector('tfoot');

      if (hasTh) {
        if (!hasCaption && !hasSummary && !hasAriaDescribedby) {
          items.push({
            message: 'Tableau de données sans titre (caption, summary ou aria-describedby)',
            element: table,
            type: 'suggestion',
            severity: 'warning',
          });
        }

        const ths = table.querySelectorAll('th');
        ths.forEach((th) => {
          const hasScope = th.hasAttribute('scope');
          const hasId = th.id && th.id.trim() !== '';
          const hasRole = th.getAttribute('role') === 'columnheader' || th.getAttribute('role') === 'rowheader';
          if (!hasScope && !hasId && !hasRole) {
            items.push({
              message: 'En-tête de tableau sans scope, id ou role',
              element: th,
              type: 'suggestion',
              severity: 'warning',
            });
          }
        });

        const thsWithId = table.querySelectorAll('th[id]');
        if (thsWithId.length > 0) {
          const tds = table.querySelectorAll('td');
          tds.forEach((td) => {
            if (!td.hasAttribute('headers')) {
              const row = td.closest('tr');
              const colIndex = Array.from(row?.children || []).indexOf(td);
              const headerRow = table.querySelector('thead tr') || table.querySelector('tr');
              const headerTh = headerRow?.children[colIndex];
              if (headerTh?.tagName === 'TH' && headerTh.id) {
                items.push({
                  message: 'Cellule sans attribut headers malgré en-tête avec id',
                  element: td,
                  type: 'suggestion',
                  severity: 'info',
                });
              }
            }
          });
        }
      } else if (!hasThead && !hasTfoot && !hasCaption) {
        if (!table.getAttribute('role') || table.getAttribute('role') !== 'presentation') {
          table.setAttribute('role', 'presentation');
          items.push({
            message: 'role="presentation" ajouté sur tableau de mise en forme',
            element: table,
            type: 'enhancement',
          });
        }
      }
    });

    return items;
  }
}
