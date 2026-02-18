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
import { FrameEnhancer } from './enhancers/FrameEnhancer.js';
import { TableEnhancer } from './enhancers/TableEnhancer.js';
import { DocumentEnhancer } from './enhancers/DocumentEnhancer.js';
import { ContrastEnhancer } from './enhancers/ContrastEnhancer.js';
import { FocusEnhancer } from './enhancers/FocusEnhancer.js';
import { render as renderVisualReport } from './VisualReport.js';
import { renderAccessibilityPanel } from './AccessibilityPanel.js';
import { loadReadSpeaker } from './ReadSpeakerLoader.js';
import { getSelector } from './utils/getSelector.js';
import { calculateScore } from './utils/scoreUtils.js';

const DEFAULT_OPTIONS = {
  mode: 'enhance',
  injectFocusStyles: true,
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
    frames: true,
    tables: true,
    document: true,
    contrast: true,
    focus: true,
  },
  productNameSelectors: [],
  defaultLang: 'fr',
  watch: true,
  logReport: true,
  visualReport: false,
  onReport: null,
  accessibilityToolbar: false,
  readSpeaker: false,
};

/** En mode enhance : masquer les suggestions des catégories d'audit pur du rapport affiché */
const AUDIT_ONLY_SOURCES = new Set([
  'Images (audit)',
  'Titres (audit)',
  'Vidéos (audit)',
  'Cadres (audit)',
  'Tableaux (audit)',
  'Document (audit)',
  'Contraste (audit)',
  'Focus (audit)',
]);

const SEVERITY_DEFAULTS = { enhancement: 'info', suggestion: 'warning' };

function normalizeItem(item) {
  if (typeof item === 'string') {
    return { message: item, element: undefined, type: 'enhancement', severity: 'info' };
  }
  const type = item.type || 'enhancement';
  const severity = item.severity ?? SEVERITY_DEFAULTS[type] ?? 'info';
  return {
    message: item.message || '',
    fix: item.fix,
    description: item.description,
    element: item.element,
    type,
    severity,
    rgaaRef: item.rgaaRef || item.rgaaCriterion,
  };
}

/**
 * Orchestrateur principal : exécute tous les enhancers et observe le DOM pour le contenu dynamique.
 */
export class AkyosAccessibility {
  /**
   * @param {Object} [options={}] - Configuration
   * @param {'enhance'|'audit'} [options.mode='enhance'] - Mode enhance : applique les corrections automatiquement. Mode audit : ne modifie rien, génère un rapport uniquement.
   * @param {Object} [options.enhancers] - Activer/désactiver chaque enhancer
   * @param {string[]} [options.productNameSelectors] - Sélecteurs pour trouver le nom produit
   * @param {string} [options.defaultLang] - Langue par défaut pour <html>
   * @param {boolean} [options.watch] - Observer le DOM pour contenu dynamique (SPA)
   * @param {boolean} [options.logReport] - Afficher le rapport dans la console
   * @param {boolean} [options.visualReport] - Afficher le rapport visuel (badge + panneau)
   * @param {function} [options.onReport] - Callback (report, instance) => void appelé à chaque rapport
   * @param {boolean} [options.accessibilityToolbar] - Afficher le panel d'accessibilité visuelle (daltonisme, taille du texte). Mode audit : désactivé par défaut.
   * @param {boolean|object} [options.readSpeaker] - Activer ReadSpeaker (lecteur vocal). false : désactivé (défaut). { readerId: string, lang?: string, rsConf?: object } : config complète (licence requise)
   */
  constructor(options = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    if (opts.visualReport && options.logReport === undefined) {
      opts.logReport = false;
    }
    if (opts.mode === 'audit' && options.accessibilityToolbar === undefined) {
      opts.accessibilityToolbar = false;
    }
    if (opts.mode === 'audit' && options.readSpeaker === undefined) {
      opts.readSpeaker = false;
    }
    this.options = opts;
    this.auditOnly = opts.mode === 'audit';
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
    if (this.options.readSpeaker && typeof document !== 'undefined') {
      loadReadSpeaker(this.options.readSpeaker);
    }
  }

  createEnhancers() {
    const { enhancers, productNameSelectors, defaultLang } = this.options;
    const enhancerOpts = { auditOnly: this.auditOnly };

    if (enhancers.lang) {
      const e = new LangEnhancer({ defaultLang, ...enhancerOpts });
      this.enhancerCategories.set(e, 'Lang');
      this.enhancers.push(e);
    }
    if (enhancers.links) {
      const e = new LinkEnhancer(enhancerOpts);
      this.enhancerCategories.set(e, 'Liens externes');
      this.enhancers.push(e);
    }
    if (enhancers.skipLinks) {
      const e = new SkipLinkEnhancer({ ...this.options, ...enhancerOpts });
      this.enhancerCategories.set(e, 'Skip link');
      this.enhancers.push(e);
    }
    if (enhancers.buttons) {
      const e = new ButtonEnhancer({ productNameSelectors, ...enhancerOpts });
      this.enhancerCategories.set(e, 'Boutons e-commerce');
      this.enhancers.push(e);
    }
    if (enhancers.images) {
      const e = new ImageEnhancer(enhancerOpts);
      this.enhancerCategories.set(e, 'Images (audit)');
      this.enhancers.push(e);
    }
    if (enhancers.headings) {
      const e = new HeadingEnhancer(enhancerOpts);
      this.enhancerCategories.set(e, 'Titres (audit)');
      this.enhancers.push(e);
    }
    if (enhancers.forms) {
      const e = new FormEnhancer(enhancerOpts);
      this.enhancerCategories.set(e, 'Formulaires');
      this.enhancers.push(e);
    }
    if (enhancers.landmarks) {
      const e = new LandmarkEnhancer(enhancerOpts);
      this.enhancerCategories.set(e, 'Landmarks');
      this.enhancers.push(e);
    }
    if (enhancers.videos) {
      const e = new VideoEnhancer(enhancerOpts);
      this.enhancerCategories.set(e, 'Vidéos (audit)');
      this.enhancers.push(e);
    }
    if (enhancers.icons) {
      const e = new IconEnhancer(enhancerOpts);
      this.enhancerCategories.set(e, 'Icônes décoratives');
      this.enhancers.push(e);
    }
    if (enhancers.frames) {
      const e = new FrameEnhancer(enhancerOpts);
      this.enhancerCategories.set(e, 'Cadres (audit)');
      this.enhancers.push(e);
    }
    if (enhancers.tables) {
      const e = new TableEnhancer(enhancerOpts);
      this.enhancerCategories.set(e, 'Tableaux (audit)');
      this.enhancers.push(e);
    }
    if (enhancers.document) {
      const e = new DocumentEnhancer(enhancerOpts);
      this.enhancerCategories.set(e, 'Document (audit)');
      this.enhancers.push(e);
    }
    if (enhancers.contrast) {
      const e = new ContrastEnhancer(enhancerOpts);
      this.enhancerCategories.set(e, 'Contraste (audit)');
      this.enhancers.push(e);
    }
    if (enhancers.focus) {
      const e = new FocusEnhancer({ ...enhancerOpts, injectFocusStyles: this.options.injectFocusStyles });
      this.enhancerCategories.set(e, 'Focus (audit)');
      this.enhancers.push(e);
    }
  }

  run(silent = true) {
    if (typeof document === 'undefined') return;
    const enhancements = [];
    const suggestions = [];
    const conformant = [];

    this.enhancers.forEach((e) => {
      const result = e.run();
      const items = Array.isArray(result) ? result : [];
      const source = this.enhancerCategories.get(e) || 'Autre';

      items.forEach((raw) => {
        const item = normalizeItem(raw);
        const entry = { ...item, source };
        if (item.type === 'conformant') {
          conformant.push(entry);
        } else if (item.type === 'suggestion') {
          suggestions.push(entry);
        } else {
          enhancements.push(entry);
        }
      });
    });

    const { score, details } = calculateScore(enhancements, suggestions, conformant);
    const report = {
      enhancements,
      suggestions,
      conformant,
      score,
      scoreDetails: details,
      mode: this.options.mode,
      timestamp: new Date().toISOString(),
    };
    this.lastReport = report;

    if (typeof this.options.onReport === 'function') {
      this.options.onReport(report, this);
    }

    let displayReport = report;
    if (!silent && this.options.mode === 'enhance') {
      const displaySuggestions = suggestions.filter((s) => !AUDIT_ONLY_SOURCES.has(s.source));
      const { score: displayScore, details: displayDetails } = calculateScore(enhancements, displaySuggestions, conformant);
      displayReport = {
        ...report,
        suggestions: displaySuggestions,
        score: displayScore,
        scoreDetails: displayDetails,
      };
    }

    if (!silent) {
      const hasContent = enhancements.length > 0 || suggestions.length > 0 || conformant.length > 0;
      if (this.options.visualReport && hasContent) {
        renderVisualReport(displayReport);
      }
      if (this.options.logReport && hasContent) {
        this.logReport({ enhancements, suggestions: displayReport.suggestions, conformant, mode: this.options.mode });
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
        fix: item.fix,
        description: item.description,
        source: item.source,
        type: item.type,
        severity: item.severity,
        rgaaRef: item.rgaaRef,
        selector: item.element ? getSelector(item.element) : null,
      }));
    return {
      enhancements: toSerializable(this.lastReport.enhancements),
      suggestions: toSerializable(this.lastReport.suggestions),
      conformant: toSerializable(this.lastReport.conformant || []),
      score: this.lastReport.score,
      scoreDetails: this.lastReport.scoreDetails,
      mode: this.lastReport.mode,
      timestamp: this.lastReport.timestamp,
    };
  }

  logReport(report) {
    if (typeof console === 'undefined') return;
    const style = 'color: #22d3ee; font-weight: bold;';
    const modeLabel = report.mode === 'audit' ? ' (mode audit)' : '';
    console.group(`%c[Akyos Accessibility] Rapport accessibilité${modeLabel}`, style);

    if (report.conformant?.length > 0) {
      console.group('%cPoints conformes', 'color: #22c55e;');
      report.conformant.forEach((item) => {
        const msg = typeof item === 'string' ? item : item.message;
        console.log('✓', msg);
      });
      console.groupEnd();
    }
    if (report.enhancements.length > 0) {
      console.group('%cAméliorations appliquées', 'color: #67e8f9;');
      report.enhancements.forEach((item) => {
        const msg = typeof item === 'string' ? item : item.message;
        console.log('✓', msg);
      });
      console.groupEnd();
    }
    if (report.suggestions.length > 0) {
      console.group('%cÀ corriger', 'color: #f59e0b;');
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
