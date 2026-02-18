import { BaseEnhancer } from './BaseEnhancer.js';

/**
 * Ajoute l'attribut lang sur <html> s'il est manquant.
 */
export class LangEnhancer extends BaseEnhancer {
  run() {
    const html = document.documentElement;
    const hasLang = html.hasAttribute('lang') && html.getAttribute('lang').trim() !== '';
    if (this.options.auditOnly) {
      if (hasLang) {
        return [{ message: 'Langue définie sur <html>', element: html, type: 'conformant' }];
      }
      return [{
        message: 'Attribut lang manquant sur <html>',
        fix: 'Ajoutez lang="fr" (ou la langue appropriée) sur <html>.',
        element: html,
        type: 'suggestion',
        severity: 'error',
        rgaaRef: '8.6',
      }];
    }
    if (!hasLang) {
      const lang = this.options.defaultLang || 'fr';
      html.setAttribute('lang', lang);
      return [{ message: `lang="${lang}" ajouté sur <html>`, description: 'L\'attribut lang indique la langue de la page aux lecteurs d\'écran.',
        element: html, type: 'enhancement', rgaaRef: '8.6' }];
    }
    return [];
  }
}
