import { BaseEnhancer } from './BaseEnhancer.js';

/**
 * Ajoute l'attribut lang sur <html> s'il est manquant.
 */
export class LangEnhancer extends BaseEnhancer {
  run() {
    const html = document.documentElement;
    if (!html.hasAttribute('lang')) {
      const lang = this.options.defaultLang || 'fr';
      html.setAttribute('lang', lang);
      return [{ message: `lang="${lang}" ajouté sur <html>`, element: html, type: 'enhancement' }];
    }
    return [];
  }
}
