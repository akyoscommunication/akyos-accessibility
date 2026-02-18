import { LangEnhancer } from './enhancers/LangEnhancer.js';
import { LinkEnhancer } from './enhancers/LinkEnhancer.js';
import { SkipLinkEnhancer } from './enhancers/SkipLinkEnhancer.js';
import { ButtonEnhancer } from './enhancers/ButtonEnhancer.js';
import { ImageEnhancer } from './enhancers/ImageEnhancer.js';
import { HeadingEnhancer } from './enhancers/HeadingEnhancer.js';
import { FormEnhancer } from './enhancers/FormEnhancer.js';
import { LandmarkEnhancer } from './enhancers/LandmarkEnhancer.js';
import { VideoEnhancer } from './enhancers/VideoEnhancer.js';
import { IconEnhancer } from './enhancers/IconEnhancer.js';
import { render as renderVisualReport } from './VisualReport.js';
import { renderAccessibilityPanel } from './AccessibilityPanel.js';
import { getSelector } from './utils/getSelector.js';

const DEFAULT_OPTIONS = {
  enhancers: {
    lang: true,
    links: true,
    skipLinks: true,
    buttons: true,
    images: true,
    headings: true,
    forms: true,
    landmarks: true,
    videos: true,
    icons: true,
  },
  productNameSelectors: [],
  defaultLang: 'fr',
  watch: true,
  logReport: true,
  visualReport: false,
  onReport: null,
  accessibilityToolbar: false,
};

const SUGGESTION_CATEGORIES = new Set(['Images (audit)', 'Titres (audit)', 'Vidéos (audit)']);

const SEVERITY_DEFAULTS = { enhancement: 'info', suggestion: 'warning' };

function normalizeItem(item) {
  if (typeof item === 'string') {
    return { message: item, element: undefined, type: 'enhancement', severity: 'info' };
  }
  const type = item.type || 'enhancement';
  const severity = item.severity ?? SEVERITY_DEFAULTS[type] ?? 'info';
  return {
    message: item.message || '',
    element: item.element,
    type,
    severity,
  };
}

function calculateScore(enhancements, suggestions) {
  let score = 100;
  score -= suggestions.length * 8;
  score += Math.min(enhancements.length * 2, 20);
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Orchestrateur principal : exécute tous les enhancers et observe le DOM pour le contenu dynamique.
 */
export class AkyosAccessibility {
  /**
   * @param {Object} [options={}] - Configuration
   * @param {Object} [options.enhancers] - Activer/désactiver chaque enhancer
   * @param {string[]} [options.productNameSelectors] - Sélecteurs pour trouver le nom produit
   * @param {string} [options.defaultLang] - Langue par défaut pour <html>
   * @param {boolean} [options.watch] - Observer le DOM pour contenu dynamique (SPA)
   * @param {boolean} [options.logReport] - Afficher le rapport dans la console
   * @param {boolean} [options.visualReport] - Afficher le rapport visuel (badge + panneau)
   * @param {function} [options.onReport] - Callback (report, instance) => void appelé à chaque rapport
   * @param {boolean} [options.accessibilityToolbar] - Afficher le panel d'accessibilité visuelle (daltonisme, taille du texte)
   */
  constructor(options = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    if (opts.visualReport && options.logReport === undefined) {
      opts.logReport = false;
    }
    this.options = opts;
    this.enhancers = [];
    this.enhancerCategories = new Map();
    this.observer = null;
    this.lastReport = null;
    this.init();
  }

  init() {
    this.createEnhancers();
    this.run(false);
    if (this.options.watch && typeof MutationObserver !== 'undefined') {
      this.observe();
    }
    if (this.options.accessibilityToolbar && typeof document !== 'undefined' && document.body) {
      renderAccessibilityPanel();
    }
  }

  createEnhancers() {
    const { enhancers, productNameSelectors, defaultLang } = this.options;

    if (enhancers.lang) {
      const e = new LangEnhancer({ defaultLang });
      this.enhancerCategories.set(e, 'Lang');
      this.enhancers.push(e);
    }
    if (enhancers.links) {
      const e = new LinkEnhancer();
      this.enhancerCategories.set(e, 'Liens externes');
      this.enhancers.push(e);
    }
    if (enhancers.skipLinks) {
      const e = new SkipLinkEnhancer(this.options);
      this.enhancerCategories.set(e, 'Skip link');
      this.enhancers.push(e);
    }
    if (enhancers.buttons) {
      const e = new ButtonEnhancer({ productNameSelectors });
      this.enhancerCategories.set(e, 'Boutons e-commerce');
      this.enhancers.push(e);
    }
    if (enhancers.images) {
      const e = new ImageEnhancer();
      this.enhancerCategories.set(e, 'Images (audit)');
      this.enhancers.push(e);
    }
    if (enhancers.headings) {
      const e = new HeadingEnhancer();
      this.enhancerCategories.set(e, 'Titres (audit)');
      this.enhancers.push(e);
    }
    if (enhancers.forms) {
      const e = new FormEnhancer();
      this.enhancerCategories.set(e, 'Formulaires');
      this.enhancers.push(e);
    }
    if (enhancers.landmarks) {
      const e = new LandmarkEnhancer();
      this.enhancerCategories.set(e, 'Landmarks');
      this.enhancers.push(e);
    }
    if (enhancers.videos) {
      const e = new VideoEnhancer();
      this.enhancerCategories.set(e, 'Vidéos (audit)');
      this.enhancers.push(e);
    }
    if (enhancers.icons) {
      const e = new IconEnhancer();
      this.enhancerCategories.set(e, 'Icônes décoratives');
      this.enhancers.push(e);
    }
  }

  run(silent = true) {
    if (typeof document === 'undefined') return;
    const enhancements = [];
    const suggestions = [];

    this.enhancers.forEach((e) => {
      const result = e.run();
      const items = Array.isArray(result) ? result : [];
      const source = this.enhancerCategories.get(e) || 'Autre';
      const isSuggestion = SUGGESTION_CATEGORIES.has(source);

      items.forEach((raw) => {
        const item = normalizeItem(raw);
        const entry = { ...item, source };
        if (isSuggestion || item.type === 'suggestion') {
          suggestions.push(entry);
        } else {
          enhancements.push(entry);
        }
      });
    });

    const report = {
      enhancements,
      suggestions,
      score: calculateScore(enhancements, suggestions),
      timestamp: new Date().toISOString(),
    };
    this.lastReport = report;

    if (typeof this.options.onReport === 'function') {
      this.options.onReport(report, this);
    }

    if (!silent) {
      if (this.options.visualReport && (enhancements.length > 0 || suggestions.length > 0)) {
        renderVisualReport(report);
      }
      if (this.options.logReport && (enhancements.length > 0 || suggestions.length > 0)) {
        this.logReport({ enhancements, suggestions });
      }
    }
  }

  /**
   * Retourne le dernier rapport (avec références DOM).
   */
  getReport() {
    return this.lastReport;
  }

  /**
   * Retourne le rapport sérialisable en JSON (sans références DOM, avec selector).
   * Utile pour export CI, audit, intégration.
   */
  getReportJSON() {
    if (!this.lastReport) return null;
    const toSerializable = (items) =>
      items.map((item) => ({
        message: item.message,
        source: item.source,
        type: item.type,
        severity: item.severity,
        selector: item.element ? getSelector(item.element) : null,
      }));
    return {
      enhancements: toSerializable(this.lastReport.enhancements),
      suggestions: toSerializable(this.lastReport.suggestions),
      score: this.lastReport.score,
      timestamp: this.lastReport.timestamp,
    };
  }

  logReport(report) {
    if (typeof console === 'undefined') return;
    const style = 'color: #22d3ee; font-weight: bold;';
    console.group('%c[Akyos Accessibility] Rapport accessibilité', style);

    if (report.enhancements.length > 0) {
      console.group('%cAméliorations appliquées', 'color: #67e8f9;');
      report.enhancements.forEach((item) => {
        const msg = typeof item === 'string' ? item : item.message;
        console.log('✓', msg);
      });
      console.groupEnd();
    }
    if (report.suggestions.length > 0) {
      console.group('%cSuggestions', 'color: #f59e0b;');
      report.suggestions.forEach((item) => {
        const msg = typeof item === 'string' ? item : item.message;
        console.log('⚠', msg);
      });
      console.groupEnd();
    }
    console.groupEnd();
  }

  observe() {
    if (!document.body) return;

    this.observer = new MutationObserver(() => {
      this.run(true);
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}
