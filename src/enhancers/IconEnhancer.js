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

        svg.setAttribute('aria-hidden', 'true');
        const parentTag = container.tagName.toLowerCase();
        items.push({
          message: `aria-hidden="true" ajouté sur icône décorative dans <${parentTag}>`,
          element: svg,
          type: 'enhancement',
        });
      });
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
}
