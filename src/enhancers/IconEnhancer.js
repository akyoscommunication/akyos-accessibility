import { BaseEnhancer } from './BaseEnhancer.js';

/**
 * Détecte les SVG/icônes décoratives (enfant direct de <a> ou <button> sans autre contenu texte)
 * et ajoute aria-hidden="true" pour éviter qu'elles soient lues par les lecteurs d'écran.
 */
export class IconEnhancer extends BaseEnhancer {
  run() {
    const items = [];
    const containers = document.querySelectorAll('a, button');

    containers.forEach((container) => {
      if (!this.hasOnlyDecorativeSvg(container)) return;

      const svgs = container.querySelectorAll(':scope > svg');
      svgs.forEach((svg) => {
        if (svg.getAttribute('aria-hidden') === 'true') return;
        if (svg.getAttribute('role') === 'img' && svg.getAttribute('aria-label')) return;
        if (svg.getAttribute('aria-labelledby')) return;

        if (this.options.auditOnly) {
          const parentTag = container.tagName.toLowerCase();
          items.push({
            message: `Icône décorative sans aria-hidden dans <${parentTag}>`,
            fix: 'Ajoutez aria-hidden="true" sur le SVG décoratif.',
            element: svg,
            type: 'suggestion',
            severity: 'info',
            rgaaRef: '1.2',
          });
          return;
        }
        svg.setAttribute('aria-hidden', 'true');
        const parentTag = container.tagName.toLowerCase();
        items.push({
          message: `aria-hidden="true" ajouté sur icône décorative dans <${parentTag}>`,
          description: 'aria-hidden="true" masque l\'icône aux lecteurs d\'écran car le texte du bouton/lien suffit.',
          element: svg,
          type: 'enhancement',
          rgaaRef: '1.2',
        });
      });
    });

    document.querySelectorAll('div svg, span svg').forEach((svg) => {
      if (svg.closest('a, button')) return;
      if (svg.getAttribute('aria-hidden') === 'true') return;
      if (svg.getAttribute('role') === 'img') return;
      if (svg.querySelector('title')?.textContent?.trim()) return;
      if (svg.getAttribute('aria-label')) return;
      if (svg.getAttribute('aria-labelledby')) return;
      if (svg.closest('svg')) return;

      if (this.looksDecorative(svg)) {
        if (this.options.auditOnly) {
          items.push({
            message: 'SVG décoratif isolé sans aria-hidden',
            fix: 'Ajoutez aria-hidden="true" sur le SVG décoratif.',
            element: svg,
            type: 'suggestion',
            severity: 'info',
            rgaaRef: '1.2',
          });
        } else {
          svg.setAttribute('aria-hidden', 'true');
          items.push({
            message: 'aria-hidden="true" ajouté sur SVG décoratif isolé',
            description: 'aria-hidden="true" masque le SVG décoratif aux lecteurs d\'écran.',
            element: svg,
            type: 'enhancement',
            rgaaRef: '1.2',
          });
        }
      }
    });

    return items;
  }

  /**
   * Vérifie si le conteneur a uniquement des SVG (et pas de texte visible).
   */
  hasOnlyDecorativeSvg(container) {
    const text = container.textContent?.trim() || '';
    if (text.length > 0) return false;

    const children = Array.from(container.childNodes);
    const hasSvg = children.some((node) => node.nodeName === 'svg');
    const hasNonSvg = children.some((node) => {
      if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) return true;
      if (node.nodeType === Node.ELEMENT_NODE && node.nodeName !== 'svg') return true;
      return false;
    });

    return hasSvg && !hasNonSvg;
  }

  looksDecorative(svg) {
    const hasText = svg.querySelector('text');
    const hasUse = svg.querySelector('use');
    const viewBox = svg.getAttribute('viewBox');
    const width = parseFloat(svg.getAttribute('width')) || 0;
    const height = parseFloat(svg.getAttribute('height')) || 0;
    if (hasText) return false;
    return (viewBox || width > 0 || height > 0) && !svg.closest('a, button');
  }
}
