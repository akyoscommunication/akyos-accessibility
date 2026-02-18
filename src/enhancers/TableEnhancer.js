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
            fix: 'Ajoutez <caption>Titre du tableau</caption> ou summary="..." ou aria-describedby="id-desc".',
            element: table,
            type: 'suggestion',
            severity: 'warning',
            rgaaRef: '5.1',
          });
        }

        const ths = table.querySelectorAll('th');
        const headerRow = table.querySelector('thead tr') || table.querySelector('tr');
        ths.forEach((th) => {
          const hasScope = th.hasAttribute('scope');
          const hasId = th.id && th.id.trim() !== '';
          const hasRole = th.getAttribute('role') === 'columnheader' || th.getAttribute('role') === 'rowheader';
          if (!hasScope && !hasId && !hasRole) {
            if (this.options.auditOnly) {
              items.push({
                message: 'En-tête de tableau sans scope, id ou role',
                fix: 'Ajoutez scope="col" ou scope="row" sur <th>, ou un id pour headers sur les cellules.',
                element: th,
                type: 'suggestion',
                severity: 'warning',
                rgaaRef: '5.1',
              });
            } else {
              const row = th.closest('tr');
              const isInThead = th.closest('thead');
              const colIndex = Array.from(row?.children || []).indexOf(th);
              const scope = isInThead || (headerRow && row === headerRow) ? 'col' : (colIndex === 0 ? 'row' : 'col');
              th.setAttribute('scope', scope);
              items.push({
                message: `scope="${scope}" ajouté sur en-tête de tableau`,
                description: 'L\'attribut scope associe les cellules aux en-têtes pour que les lecteurs d\'écran annoncent correctement le tableau.',
                element: th,
                type: 'enhancement',
                rgaaRef: '5.1',
              });
            }
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
                  fix: 'Ajoutez headers="id-en-tete-col id-en-tete-row" sur la cellule <td> pour l\'associer aux en-têtes.',
                  element: td,
                  type: 'suggestion',
                  severity: 'info',
                  rgaaRef: '5.2',
                });
              }
            }
          });
        }
      } else if (!hasThead && !hasTfoot && !hasCaption) {
        const hasRole = table.getAttribute('role') === 'presentation';
        if (this.options.auditOnly) {
          if (!hasRole) {
            items.push({
              message: 'Tableau de mise en forme sans role="presentation"',
              fix: 'Ajoutez role="presentation" sur les tableaux utilisés pour la mise en page.',
              element: table,
              type: 'suggestion',
              severity: 'info',
              rgaaRef: '5.3',
            });
          }
        } else if (!hasRole) {
          table.setAttribute('role', 'presentation');
          items.push({
            message: 'role="presentation" ajouté sur tableau de mise en forme',
            description: 'Le rôle presentation indique aux lecteurs d\'écran que le tableau n\'est pas un tableau de données et doit être ignoré pour la navigation.',
            element: table,
            type: 'enhancement',
            rgaaRef: '5.3',
          });
        }
      }
    });

    return items;
  }
}
