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
          fix: 'Une seule zone <main> par page. Masquez les autres (display:none) ou fusionnez le contenu.',
          element: m,
          type: 'suggestion',
          severity: 'error',
          rgaaRef: '9.2',
        });
      });
    }
    mains.forEach((el) => {
      const hasRole = el.getAttribute('role');
      const hasLabel = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby');
      if (this.options.auditOnly) {
        if (hasRole && hasLabel) {
          items.push({ message: 'Zone <main> avec role et aria-label', element: el, type: 'conformant' });
        } else {
          if (!hasRole) items.push({ message: 'Élément <main> sans role="main"', fix: 'Ajoutez role="main".', element: el, type: 'suggestion', severity: 'info', rgaaRef: '9.2' });
          if (!hasLabel) items.push({ message: 'Élément <main> sans aria-label', fix: 'Ajoutez aria-label="Contenu principal".', element: el, type: 'suggestion', severity: 'info', rgaaRef: '9.2' });
        }
      } else {
        if (!hasRole) { el.setAttribute('role', 'main'); items.push({ message: 'role="main" ajouté sur <main>', description: 'Le rôle main identifie la zone de contenu principal pour la navigation et les lecteurs d\'écran.', element: el, type: 'enhancement', rgaaRef: '9.2' }); }
        if (!hasLabel) { el.setAttribute('aria-label', LANDMARK_LABELS.main); items.push({ message: 'aria-label ajouté sur <main>', description: 'L\'aria-label décrit la région aux lecteurs d\'écran.', element: el, type: 'enhancement', rgaaRef: '9.2' }); }
      }
    });

    const navs = document.querySelectorAll('nav');
    navs.forEach((el) => {
      const hasRole = el.getAttribute('role');
      const hasLabel = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby');
      if (this.options.auditOnly) {
        if (hasRole && hasLabel) {
          items.push({ message: 'Zone <nav> avec role et aria-label', element: el, type: 'conformant' });
        } else {
          if (!hasRole) items.push({ message: 'Élément <nav> sans role="navigation"', fix: 'Ajoutez role="navigation".', element: el, type: 'suggestion', severity: 'info', rgaaRef: '9.2' });
          if (!hasLabel) items.push({ message: 'Élément <nav> sans aria-label', fix: 'Ajoutez aria-label pour identifier la navigation.', element: el, type: 'suggestion', severity: 'info', rgaaRef: '9.2' });
        }
      } else {
        if (!hasRole) { el.setAttribute('role', 'navigation'); items.push({ message: 'role="navigation" ajouté sur <nav>', description: 'Le rôle navigation identifie la zone de navigation pour les lecteurs d\'écran.', element: el, type: 'enhancement', rgaaRef: '9.2' }); }
        if (!hasLabel) { const label = navIndex === 0 ? LANDMARK_LABELS.nav : `Navigation ${navIndex + 1}`; el.setAttribute('aria-label', label); items.push({ message: `aria-label "${label}" ajouté sur <nav>`, description: 'L\'aria-label décrit la navigation pour les lecteurs d\'écran.', element: el, type: 'enhancement', rgaaRef: '9.2' }); navIndex++; }
      }
    });

    const headers = document.querySelectorAll('header');
    headers.forEach((el) => {
      const hasLabel = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby');
      if (this.options.auditOnly) {
        if (hasLabel) items.push({ message: 'Zone <header> avec aria-label', element: el, type: 'conformant' });
        else items.push({ message: 'Élément <header> sans aria-label', fix: 'Ajoutez aria-label pour les lecteurs d\'écran.', element: el, type: 'suggestion', severity: 'info', rgaaRef: '9.2' });
      } else {
        if (!hasLabel) { el.setAttribute('aria-label', LANDMARK_LABELS.header); items.push({ message: 'aria-label ajouté sur <header>', description: 'L\'aria-label décrit la zone d\'en-tête aux lecteurs d\'écran.', element: el, type: 'enhancement', rgaaRef: '9.2' }); }
      }
    });

    const footers = document.querySelectorAll('footer');
    footers.forEach((el) => {
      const hasLabel = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby');
      if (this.options.auditOnly) {
        if (hasLabel) items.push({ message: 'Zone <footer> avec aria-label', element: el, type: 'conformant' });
        else items.push({ message: 'Élément <footer> sans aria-label', fix: 'Ajoutez aria-label pour les lecteurs d\'écran.', element: el, type: 'suggestion', severity: 'info', rgaaRef: '9.2' });
      } else {
        if (!hasLabel) { el.setAttribute('aria-label', LANDMARK_LABELS.footer); items.push({ message: 'aria-label ajouté sur <footer>', description: 'L\'aria-label décrit la zone de pied de page aux lecteurs d\'écran.', element: el, type: 'enhancement', rgaaRef: '9.2' }); }
      }
    });

    const asides = document.querySelectorAll('aside');
    asides.forEach((el) => {
      const hasLabel = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby');
      if (this.options.auditOnly) {
        if (hasLabel) items.push({ message: 'Zone <aside> avec aria-label', element: el, type: 'conformant' });
        else items.push({ message: 'Élément <aside> sans aria-label', fix: 'Ajoutez aria-label pour les lecteurs d\'écran.', element: el, type: 'suggestion', severity: 'info', rgaaRef: '9.2' });
      } else {
        if (!hasLabel) { el.setAttribute('aria-label', LANDMARK_LABELS.aside); items.push({ message: 'aria-label ajouté sur <aside>', description: 'L\'aria-label décrit la zone complémentaire aux lecteurs d\'écran.', element: el, type: 'enhancement', rgaaRef: '9.2' }); }
      }
    });

    return items;
  }
}
