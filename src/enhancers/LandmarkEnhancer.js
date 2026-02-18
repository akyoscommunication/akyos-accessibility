import { BaseEnhancer } from './BaseEnhancer.js';

const LANDMARK_LABELS = {
  main: 'Contenu principal',
  nav: 'Navigation principale',
  header: 'En-tête',
  footer: 'Pied de page',
  aside: 'Contenu complémentaire',
};

/**
 * Améliore les régions ARIA :
 * - Ajoute role="main" sur <main> si absent
 * - Ajoute role="navigation" sur les <nav>
 * - Ajoute aria-label sur les landmarks non explicites
 */
export class LandmarkEnhancer extends BaseEnhancer {
  run() {
    const items = [];
    let navIndex = 0;

    const mains = document.querySelectorAll('main');
    const visibleMains = Array.from(mains).filter((m) => {
      const style = getComputedStyle(m);
      return style.display !== 'none' && style.visibility !== 'hidden' && !m.hasAttribute('hidden');
    });
    if (visibleMains.length > 1) {
      visibleMains.forEach((m) => {
        items.push({
          message: `Plusieurs éléments <main> visibles (${visibleMains.length} au total)`,
          element: m,
          type: 'suggestion',
          severity: 'error',
        });
      });
    }
    mains.forEach((el) => {
      if (!el.getAttribute('role')) {
        el.setAttribute('role', 'main');
        items.push({ message: 'role="main" ajouté sur <main>', element: el, type: 'enhancement' });
      }
      if (!el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')) {
        el.setAttribute('aria-label', LANDMARK_LABELS.main);
        items.push({ message: 'aria-label ajouté sur <main>', element: el, type: 'enhancement' });
      }
    });

    const navs = document.querySelectorAll('nav');
    navs.forEach((el) => {
      if (!el.getAttribute('role')) {
        el.setAttribute('role', 'navigation');
        items.push({ message: 'role="navigation" ajouté sur <nav>', element: el, type: 'enhancement' });
      }
      if (!el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')) {
        const label = navIndex === 0 ? LANDMARK_LABELS.nav : `Navigation ${navIndex + 1}`;
        el.setAttribute('aria-label', label);
        items.push({ message: `aria-label "${label}" ajouté sur <nav>`, element: el, type: 'enhancement' });
        navIndex++;
      }
    });

    const headers = document.querySelectorAll('header');
    headers.forEach((el) => {
      if (!el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')) {
        el.setAttribute('aria-label', LANDMARK_LABELS.header);
        items.push({ message: 'aria-label ajouté sur <header>', element: el, type: 'enhancement' });
      }
    });

    const footers = document.querySelectorAll('footer');
    footers.forEach((el) => {
      if (!el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')) {
        el.setAttribute('aria-label', LANDMARK_LABELS.footer);
        items.push({ message: 'aria-label ajouté sur <footer>', element: el, type: 'enhancement' });
      }
    });

    const asides = document.querySelectorAll('aside');
    asides.forEach((el) => {
      if (!el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')) {
        el.setAttribute('aria-label', LANDMARK_LABELS.aside);
        items.push({ message: 'aria-label ajouté sur <aside>', element: el, type: 'enhancement' });
      }
    });

    return items;
  }
}
