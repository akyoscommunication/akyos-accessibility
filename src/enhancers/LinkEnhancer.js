import { BaseEnhancer } from './BaseEnhancer.js';

const EXTERNAL_LINK_SUFFIX = ' (ouvre dans un nouvel onglet)';

/**
 * Améliore les liens target="_blank" : ajoute rel="noopener noreferrer" et aria-label.
 */
export class LinkEnhancer extends BaseEnhancer {
  run() {
    const links = document.querySelectorAll('a[target="_blank"]');
    const items = [];
    links.forEach((link) => {
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
    return items;
  }
}
