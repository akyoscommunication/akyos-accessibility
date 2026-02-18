/**
 * Génère un document HTML imprimable pour export PDF via la boîte de dialogue d'impression.
 * Aucune dépendance externe : l'utilisateur choisit « Enregistrer en PDF » dans le dialogue.
 */

import { getSelector } from './getSelector.js';

const CATEGORY_LABELS = {
  Lang: 'Langue (attribut lang)',
  'Liens externes': 'Liens enrichis',
  'Skip link': 'Lien d\'évitement',
  'Boutons e-commerce': 'Boutons enrichis',
  Formulaires: 'Formulaires',
  Landmarks: 'Régions ARIA',
  'Icônes décoratives': 'Icônes décoratives',
  'Images (audit)': 'Images sans alt',
  'Titres (audit)': 'Hiérarchie des titres',
  'Vidéos (audit)': 'Vidéos sans sous-titres',
  'Cadres (audit)': 'Cadres sans titre',
  'Tableaux (audit)': 'Tableaux',
  'Document (audit)': 'Document',
  'Contraste (audit)': 'Contraste',
  'Focus (audit)': 'Focus visible',
  Autre: 'Autre',
};

const SEVERITY_LABELS = {
  error: 'Erreur',
  warning: 'Avertissement',
  info: 'Info',
};

const CATEGORY_DESCRIPTIONS = {
  Lang: 'Attribut lang sur <html> pour indiquer la langue de la page aux lecteurs d\'écran.',
  'Liens externes': 'Liens target="_blank" enrichis avec rel="noopener noreferrer" et aria-label.',
  'Skip link': 'Lien d\'évitement pour permettre aux utilisateurs au clavier de sauter au contenu principal.',
  'Boutons e-commerce': 'Boutons « Ajouter au panier » avec aria-label incluant le nom du produit.',
  Formulaires: 'Association labels/inputs, aria-required et aria-invalid pour les champs en erreur.',
  Landmarks: 'Rôles ARIA et aria-label sur main, nav, header, footer pour la navigation.',
  'Icônes décoratives': 'aria-hidden sur les SVG décoratifs pour éviter une lecture redondante.',
  'Images (audit)': 'Images sans attribut alt — à corriger manuellement pour décrire le contenu.',
  'Titres (audit)': 'Hiérarchie des titres (h1–h6) : sauts de niveau, h1 manquant ou multiples.',
  'Vidéos (audit)': 'Vidéos sans sous-titres — à ajouter pour l\'accessibilité audio.',
  'Cadres (audit)': 'Cadres iframe/frame sans attribut title (RGAA 2.1).',
  'Tableaux (audit)': 'Tableaux de données sans caption, en-têtes sans scope, tableaux de mise en forme.',
  'Document (audit)': 'Éléments obligatoires : titre de page manquant ou vide (RGAA 8.5).',
  'Contraste (audit)': 'Contraste texte/arrière-plan insuffisant (RGAA 3.2).',
  'Focus (audit)': 'Focus non visible sur les éléments interactifs (RGAA 10.7).',
  Autre: 'Autres éléments détectés.',
};

function getCategoryLabel(source) {
  return CATEGORY_LABELS[source] || source;
}

function getCategoryDescription(source) {
  return CATEGORY_DESCRIPTIONS[source] || '';
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function getScoreLetter(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

function getScoreExplanation(score) {
  if (score >= 90) return 'Excellente accessibilité. Peu ou pas de corrections à apporter.';
  if (score >= 80) return 'Bonne accessibilité. Quelques améliorations mineures possibles.';
  if (score >= 70) return 'Accessibilité correcte. Des corrections sont recommandées.';
  if (score >= 50) return 'Accessibilité insuffisante. Des corrections importantes sont nécessaires.';
  return 'Accessibilité critique. De nombreuses corrections sont requises.';
}

function groupBySource(items) {
  const groups = {};
  items.forEach((item) => {
    const source = item.source || 'Autre';
    if (!groups[source]) groups[source] = [];
    groups[source].push(item);
  });
  return groups;
}

function toSerializableItem(item) {
  const msg = typeof item === 'string' ? item : (item.message || '');
  const source = item.source || 'Autre';
  const type = item.type || 'enhancement';
  const severity = item.severity || (type === 'suggestion' ? 'warning' : 'info');
  const selector = item.element ? getSelector(item.element) : null;
  return { message: msg, source, type, severity, selector };
}

/**
 * Génère le HTML du rapport pour impression / export PDF.
 * @param {Object} report - Rapport { enhancements, suggestions, score, timestamp }
 * @returns {string} HTML complet
 */
export function generateReportHtml(report) {
  const { enhancements = [], suggestions = [], score = 100, timestamp = '' } = report;

  const enhSerial = enhancements.map(toSerializableItem);
  const suggSerial = suggestions.map(toSerializableItem);

  const letter = getScoreLetter(score);
  const scoreExplanation = getScoreExplanation(score);
  const dateStr = timestamp ? new Date(timestamp).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) : new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const enhGroups = groupBySource(enhSerial);
  const suggGroups = groupBySource(suggSerial);

  const allSources = [...new Set([...Object.keys(enhGroups), ...Object.keys(suggGroups)])];

  let sectionsHtml = '';

  allSources.forEach((source) => {
    const enhItems = enhGroups[source] || [];
    const suggItems = suggGroups[source] || [];
    if (enhItems.length === 0 && suggItems.length === 0) return;

    const label = getCategoryLabel(source);
    const desc = getCategoryDescription(source);

    let itemsHtml = '';

    enhItems.forEach((item) => {
      const sevLabel = SEVERITY_LABELS[item.severity] || item.severity;
      itemsHtml += `
        <tr class="item-row item-row--enhancement">
          <td class="item-icon">✓</td>
          <td class="item-severity item-severity--${escapeHtml(item.severity)}">${escapeHtml(sevLabel)}</td>
          <td class="item-message">${escapeHtml(item.message)}</td>
          ${item.selector ? `<td class="item-selector"><code>${escapeHtml(item.selector)}</code></td>` : '<td></td>'}
        </tr>`;
    });

    suggItems.forEach((item) => {
      const sevLabel = SEVERITY_LABELS[item.severity] || item.severity;
      itemsHtml += `
        <tr class="item-row item-row--suggestion">
          <td class="item-icon">⚠</td>
          <td class="item-severity item-severity--${escapeHtml(item.severity)}">${escapeHtml(sevLabel)}</td>
          <td class="item-message">${escapeHtml(item.message)}</td>
          ${item.selector ? `<td class="item-selector"><code>${escapeHtml(item.selector)}</code></td>` : '<td></td>'}
        </tr>`;
    });

    sectionsHtml += `
      <section class="report-section">
        <h3 class="section-title">${escapeHtml(label)}</h3>
        ${desc ? `<p class="section-desc">${escapeHtml(desc)}</p>` : ''}
        <table class="items-table">
          <thead>
            <tr>
              <th scope="col" class="col-icon"></th>
              <th scope="col" class="col-severity">Sévérité</th>
              <th scope="col" class="col-message">Message</th>
              <th scope="col" class="col-selector">Sélecteur</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
      </section>`;
  });

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport d'accessibilité — Akyos Accessibility</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 2rem;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #1a1a1a;
    }
    @media print {
      body { padding: 1rem; }
      .no-print { display: none !important; }
    }
    .header {
      border-bottom: 2px solid #22d3ee;
      padding-bottom: 1.5rem;
      margin-bottom: 2rem;
    }
    .header h1 {
      margin: 0 0 0.25rem;
      font-size: 1.5rem;
      font-weight: 700;
      color: #0a0a0b;
    }
    .header .meta {
      font-size: 0.9rem;
      color: #52525b;
    }
    .score-block {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      margin: 1.5rem 0;
      padding: 1rem 1.25rem;
      background: #f4f4f5;
      border-radius: 8px;
      border-left: 4px solid #22d3ee;
    }
    .score-value {
      font-size: 2rem;
      font-weight: 700;
      color: #0891b2;
    }
    .score-letter {
      font-size: 1.25rem;
      font-weight: 600;
      color: #0e7490;
    }
    .score-explanation {
      flex: 1;
      color: #3f3f46;
      font-size: 0.95rem;
    }
    .summary {
      display: flex;
      gap: 2rem;
      margin-bottom: 2rem;
      font-size: 0.9rem;
      color: #52525b;
    }
    .summary span { font-weight: 600; }
    .summary--enhancement { color: #16a34a; }
    .summary--suggestion { color: #d97706; }
    .intro {
      margin-bottom: 2rem;
      padding: 1rem;
      background: #fafafa;
      border-radius: 6px;
      font-size: 0.9rem;
      color: #3f3f46;
    }
    .intro strong { color: #1a1a1a; }
    .report-section {
      margin-bottom: 2rem;
      page-break-inside: avoid;
    }
    .section-title {
      margin: 0 0 0.5rem;
      font-size: 1.1rem;
      font-weight: 600;
      color: #0891b2;
    }
    .section-desc {
      margin: 0 0 0.75rem;
      font-size: 0.85rem;
      color: #71717a;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }
    .items-table th, .items-table td {
      padding: 0.5rem 0.75rem;
      text-align: left;
      border-bottom: 1px solid #e4e4e7;
    }
    .items-table th {
      font-weight: 600;
      color: #52525b;
      background: #f4f4f5;
    }
    .item-row--enhancement .item-icon { color: #16a34a; }
    .item-row--suggestion .item-icon { color: #d97706; }
    .item-severity {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    .item-severity--error { color: #dc2626; }
    .item-severity--warning { color: #d97706; }
    .item-severity--info { color: #64748b; }
    .item-message { color: #1a1a1a; }
    .item-selector code {
      font-size: 0.8rem;
      padding: 0.15rem 0.35rem;
      background: #e4e4e7;
      border-radius: 4px;
    }
    .col-icon { width: 2rem; }
    .col-severity { width: 6rem; }
    .col-selector { width: 12rem; }
    .print-btn {
      position: fixed;
      top: 1rem;
      right: 1rem;
      padding: 0.5rem 1rem;
      font-size: 0.9rem;
      font-weight: 600;
      color: #fff;
      background: #0891b2;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(8, 145, 178, 0.3);
    }
    .print-btn:hover { background: #0e7490; }
  </style>
</head>
<body>
  <button type="button" class="print-btn no-print" onclick="window.print()">Enregistrer en PDF</button>

  <header class="header">
    <h1>Rapport d'accessibilité</h1>
    <p class="meta">Généré le ${escapeHtml(dateStr)} — Akyos Accessibility</p>
    <div class="score-block">
      <div>
        <span class="score-value">${score}/100</span>
        <span class="score-letter">(${letter})</span>
      </div>
      <p class="score-explanation">${escapeHtml(scoreExplanation)}</p>
    </div>
    <div class="summary">
      <span class="summary--enhancement">✓ ${enhSerial.length} amélioration(s) appliquée(s)</span>
      <span class="summary--suggestion">⚠ ${suggSerial.length} suggestion(s) à corriger</span>
    </div>
  </header>

  <div class="intro">
    <strong>À propos de ce rapport</strong><br>
    Les <strong>améliorations</strong> (✓) ont été appliquées automatiquement par la librairie. Les <strong>suggestions</strong> (⚠) nécessitent une correction manuelle. La colonne <strong>Sévérité</strong> indique la priorité : Erreur (bloquant), Avertissement (recommandé), Info (informatif).
  </div>

  ${sectionsHtml}

  <script>
    window.onload = function() {
      var btn = document.querySelector('.print-btn');
      if (btn) btn.focus();
    };
  </script>
</body>
</html>`;
}

/**
 * Ouvre une fenêtre avec le rapport et déclenche l'impression (Enregistrer en PDF).
 * @param {Object} report - Rapport { enhancements, suggestions, score, timestamp }
 */
export function exportReportToPdf(report) {
  if (typeof window === 'undefined') return;

  const html = generateReportHtml(report);
  const win = window.open('', '_blank');
  if (!win) {
    alert('Impossible d\'ouvrir la fenêtre. Autorisez les pop-ups pour exporter en PDF.');
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  // Petit délai pour que le contenu soit rendu avant l'impression
  win.onload = () => {
    setTimeout(() => win.print(), 250);
  };
}
