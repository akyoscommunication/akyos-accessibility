import { BaseEnhancer } from './BaseEnhancer.js';

const EXTERNAL_LINK_SUFFIX = ' (ouvre dans un nouvel onglet)';

/**
 * Améliore les liens target="_blank" et audite les liens vides.
 * RGAA 6 - Liens.
 */
export class LinkEnhancer extends BaseEnhancer {
  run() {
    const items = [];

    document.querySelectorAll('a[target="_blank"]').forEach((link) => {
      const hasRel = link.hasAttribute('rel') && link.rel.includes('noopener');
      const hasAriaLabel = link.hasAttribute('aria-label');
      if (this.options.auditOnly) {
        if (hasRel && hasAriaLabel) {
          items.push({ message: 'Lien externe conforme (rel + aria-label)', element: link, type: 'conformant' });
        } else {
          if (!hasRel) {
            items.push({
              message: 'Lien target="_blank" sans rel="noopener noreferrer"',
              fix: 'Ajoutez rel="noopener noreferrer" sur les liens target="_blank".',
              element: link,
              type: 'suggestion',
              severity: 'warning',
              rgaaRef: '6.1',
            });
          }
          if (!hasAriaLabel) {
            items.push({
              message: 'Lien externe sans indication pour lecteurs d\'écran',
              fix: 'Ajoutez aria-label avec le texte du lien + " (ouvre dans un nouvel onglet)".',
              element: link,
              type: 'suggestion',
              severity: 'info',
              rgaaRef: '6.1',
            });
          }
        }
        return;
      }
      let modified = false;
      if (!hasRel) {
        const rel = link.getAttribute('rel') || '';
        const parts = rel.split(/\s+/).filter(Boolean);
        if (!parts.includes('noopener')) parts.push('noopener');
        if (!parts.includes('noreferrer')) parts.push('noreferrer');
        link.setAttribute('rel', parts.join(' '));
        modified = true;
      }
      if (!hasAriaLabel) {
        const text = link.textContent?.trim() || '';
        const ariaLabel = text
          ? `${text}${EXTERNAL_LINK_SUFFIX}`
          : EXTERNAL_LINK_SUFFIX.trim();
        link.setAttribute('aria-label', ariaLabel);
        modified = true;
      }
      if (modified) {
        const text = link.textContent?.trim() || 'Lien';
        items.push({
          message: `Lien enrichi : ${text.substring(0, 30)}${text.length > 30 ? '…' : ''}`,
          description: 'rel="noopener noreferrer" a été ajouté pour la sécurité et aria-label a été ajouté pour indiquer aux lecteurs d\'écran que le lien s\'ouvre dans un nouvel onglet.',
          element: link,
          type: 'enhancement',
          rgaaRef: '6.1',
        });
      }
    });

    document.querySelectorAll('a[href]').forEach((link) => {
      const hasText = (link.textContent || '').trim().length > 0;
      const hasAriaLabel = link.getAttribute('aria-label')?.trim().length > 0;
      const hasImgAlt = link.querySelector('img[alt]');
      const hasImgAriaLabel = link.querySelector('img[aria-label]');

      if (!hasText && !hasAriaLabel && !hasImgAlt && !hasImgAriaLabel) {
        const href = link.getAttribute('href') || '#';
        items.push({
          message: `Lien sans intitulé : ${href.substring(0, 40)}${href.length > 40 ? '…' : ''}`,
          fix: 'Ajoutez du texte dans le lien, aria-label="Description" ou alt sur l\'image si le lien contient une image.',
          element: link,
          type: 'suggestion',
          severity: 'error',
          rgaaRef: '6.1',
        });
      }
    });

    return items;
  }
}
