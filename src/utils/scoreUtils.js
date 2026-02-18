/**
 * Utilitaires de notation pour l'audit d'accessibilité.
 * Formule : taux de conformité = améliorations / (améliorations + suggestions) × 100
 * Interprétation : pourcentage des points audités qui sont conformes ou ont été corrigés automatiquement.
 */

/**
 * Calcule le score d'accessibilité (0-100).
 * Mode enhance : score = améliorations / (améliorations + suggestions)
 * Mode audit : score = conformant / (conformant + suggestions)
 * @param {Array} enhancements - Améliorations appliquées (mode enhance) ou []
 * @param {Array} suggestions - Points à corriger
 * @param {Array} [conformant=[]] - Points conformes (mode audit uniquement)
 * @returns {{ score: number, details: object }}
 */
export function calculateScore(enhancements, suggestions, conformant = []) {
  const enhCount = enhancements.length;
  const suggCount = suggestions.length;
  const confCount = conformant.length;
  const positiveCount = enhCount > 0 ? enhCount : confCount;
  const total = positiveCount + suggCount;

  let score;
  if (total === 0) {
    score = 100;
  } else {
    score = Math.round((positiveCount / total) * 100);
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    details: {
      enhancements: enhCount,
      conformant: confCount,
      suggestions: suggCount,
      total,
    },
  };
}

/**
 * Retourne la lettre de notation (A à F).
 * @param {number} score - Score 0-100
 * @returns {string}
 */
export function getScoreLetter(score) {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  if (score >= 20) return 'E';
  return 'F';
}

/**
 * Retourne l'explication professionnelle du niveau.
 * @param {number} score - Score 0-100
 * @returns {string}
 */
export function getScoreExplanation(score) {
  if (score >= 90) return 'Conforme. Niveau d\'accessibilité excellent.';
  if (score >= 75) return 'Bon. Quelques corrections mineures recommandées.';
  if (score >= 60) return 'À améliorer. Des corrections sont nécessaires pour atteindre la conformité.';
  if (score >= 40) return 'Insuffisant. Des corrections importantes sont requises.';
  if (score >= 20) return 'Critique. De nombreuses corrections sont nécessaires.';
  return 'Non conforme. Corrections majeures requises pour l\'accessibilité.';
}
