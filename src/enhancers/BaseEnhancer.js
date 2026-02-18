/**
 * Classe de base pour les enhancers d'accessibilité.
 * Chaque enhancer étend BaseEnhancer et implémente run().
 */
export class BaseEnhancer {
  /**
   * @param {Object} [options={}] - Options de configuration
   */
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * Exécute l'enhancer sur le DOM.
   * À surcharger dans chaque enhancer.
   */
  run() {
    throw new Error('run() must be implemented by subclass');
  }
}
