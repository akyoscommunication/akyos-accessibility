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
      let modified = false;
      if (!link.hasAttribute('rel') || !link.rel.includes('noopener')) {
        const rel = link.getAttribute('rel') || '';
        const parts = rel.split(/\s+/).filter(Boolean);
        if (!parts.includes('noopener')) parts.push('noopener');
        if (!parts.includes('noreferrer')) parts.push('noreferrer');
        link.setAttribute('rel', parts.join(' '));
        modified = true;
      }
      if (!link.hasAttribute('aria-label')) {
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
          element: link,
          type: 'enhancement',
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
          element: link,
          type: 'suggestion',
          severity: 'error',
        });
      }
    });

    return items;
  }
}
