/**
 * Utilitaires pour les références RGAA.
 * @see https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/
 */

const RGAA_BASE_URL = 'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/';

/**
 * Génère l'URL vers un critère RGAA.
 * @param {string} ref - Référence du critère (ex. "1.1", "2.1", "10.7")
 * @returns {string} URL avec ancre (ex. .../#critere-11)
 */
export function getRgaaUrl(ref) {
  if (!ref || typeof ref !== 'string') return RGAA_BASE_URL;
  const anchor = ref.replace('.', '');
  return `${RGAA_BASE_URL}#critere-${anchor}`;
}
