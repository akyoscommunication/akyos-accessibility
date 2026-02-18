import { BaseEnhancer } from './BaseEnhancer.js';

const SKIP_LINK_TEXT = 'Aller au contenu principal';
const SKIP_LINK_ID = 'akyos-skip-link';
const MAIN_ID = 'main-content';

/**
 * Injecte un lien "Aller au contenu principal" en premier dans body.
 * Crée un id sur main si nécessaire pour la cible.
 */
export class SkipLinkEnhancer extends BaseEnhancer {
  run() {
    const existing = document.getElementById(SKIP_LINK_ID);
    const skipLink = existing || document.querySelector('body > a[href^="#"]');
    if (this.options.auditOnly) {
      if (skipLink) {
        return [{ message: 'Lien d\'évitement présent', element: skipLink, type: 'conformant' }];
      }
      return [{
        message: 'Lien d\'évitement manquant',
        fix: 'Ajoutez un lien "Aller au contenu principal" en début de page pointant vers la zone main.',
        element: document.body,
        type: 'suggestion',
        severity: 'warning',
        rgaaRef: '12.6',
      }];
    }
    if (existing) return [];

    const main = document.querySelector('main, [role="main"], #main');
    const targetId = main?.id || MAIN_ID;
    if (main && !main.id) {
      main.id = targetId;
    }

    const link = document.createElement('a');
    link.id = SKIP_LINK_ID;
    link.href = `#${targetId}`;
    link.textContent = this.options.skipLinkText || SKIP_LINK_TEXT;
    link.setAttribute('tabindex', '0');
    link.className = this.options.skipLinkClass || 'akyos-skip-link';
    link.style.cssText =
      'position:absolute;left:-9999px;top:0;z-index:9999;padding:0.5rem 1rem;background:#000;color:#fff;';
    link.addEventListener('focus', () => {
      link.style.left = '0';
      link.style.position = 'fixed';
    });
    link.addEventListener('blur', () => {
      link.style.left = '-9999px';
      link.style.position = 'absolute';
    });

    const body = document.body;
    if (body.firstChild) {
      body.insertBefore(link, body.firstChild);
    } else {
      body.appendChild(link);
    }
    return [
      {
        message: 'Skip link "Aller au contenu principal" injecté en début de page',
        description: 'Un lien d\'évitement permet aux utilisateurs au clavier de sauter directement au contenu principal sans parcourir tous les éléments de navigation.',
        element: link,
        type: 'enhancement',
        rgaaRef: '12.6',
      },
    ];
  }
}
