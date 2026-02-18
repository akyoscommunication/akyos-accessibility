/**
 * Utilitaires pour le calcul du contraste des couleurs (WCAG 2.1).
 * RGAA 3.2 - Contraste texte/arrière-plan.
 */

/**
 * Parse une couleur CSS en [r, g, b] (0-255).
 * @param {string} cssColor - Couleur CSS (rgb, rgba, hex, etc.)
 * @returns {[number, number, number]|null} [r,g,b] ou null si invalide
 */
export function parseColor(cssColor) {
  if (!cssColor || typeof cssColor !== 'string') return null;
  const s = cssColor.trim();

  if (s === 'transparent') return null;

  const hexMatch = s.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (hexMatch) {
    const hex = hexMatch[1];
    if (hex.length === 3) {
      return [
        parseInt(hex[0] + hex[0], 16),
        parseInt(hex[1] + hex[1], 16),
        parseInt(hex[2] + hex[2], 16),
      ];
    }
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ];
  }

  const rgbMatch = s.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    return [
      Math.min(255, parseInt(rgbMatch[1], 10)),
      Math.min(255, parseInt(rgbMatch[2], 10)),
      Math.min(255, parseInt(rgbMatch[3], 10)),
    ];
  }

  return null;
}

/**
 * Calcule la luminance relative (WCAG 2.1).
 * @param {number} r - Rouge 0-255
 * @param {number} g - Vert 0-255
 * @param {number} b - Bleu 0-255
 * @returns {number} Luminance 0-1
 */
export function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calcule le ratio de contraste entre deux couleurs.
 * @param {number} lum1 - Luminance 1
 * @param {number} lum2 - Luminance 2
 * @returns {number} Ratio 1-21
 */
export function getContrastRatio(lum1, lum2) {
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Vérifie si le ratio de contraste respecte les exigences WCAG.
 * @param {number} ratio - Ratio de contraste
 * @param {number} fontSizePx - Taille de police en px
 * @param {boolean} isBold - Texte en gras
 * @returns {boolean} true si conforme
 */
export function meetsContrastRequirement(ratio, fontSizePx, isBold) {
  const threshold = fontSizePx >= 24 || (fontSizePx >= 18.5 && isBold) ? 3 : 4.5;
  return ratio >= threshold;
}
