# Akyos Accessibility

[![npm version](https://img.shields.io/npm/v/akyos-accessibility.svg)](https://www.npmjs.com/package/akyos-accessibility)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Librairie JavaScript légère qui améliore automatiquement l'accessibilité des sites web. Aucune configuration requise : une seule ligne et les corrections ARIA, labels et skip links sont appliquées. Export JSON, niveaux de sévérité et callback pour intégration CI et audit.

## Table des matières

- [Installation](#installation)
- [Démarrage rapide](#démarrage-rapide)
- [Ce qui est corrigé automatiquement](#ce-qui-est-corrigé-automatiquement)
- [Rapport visuel](#rapport-visuel)
- [Export JSON et intégration CI](#export-json-et-intégration-ci)
- [Niveaux de sévérité](#niveaux-de-sévérité)
- [Configuration](#configuration)
- [API](#api)
- [Import granulaire](#import-granulaire)
- [Licence](#licence)

## Installation

```bash
npm install akyos-accessibility
# ou
yarn add akyos-accessibility
# ou
pnpm add akyos-accessibility
```

## Démarrage rapide

```javascript
import { AkyosAccessibility } from 'akyos-accessibility';

new AkyosAccessibility(); // C'est tout.
```

La librairie analyse le DOM, applique les corrections et observe les changements pour le contenu dynamique (SPA).

## Ce qui est corrigé automatiquement

| Enhancer | Action |
|----------|--------|
| **Lang** | Ajoute `lang="fr"` sur `<html>` si manquant |
| **Links** | Liens `target="_blank"` : ajoute `rel="noopener noreferrer"` et `aria-label` avec mention « ouvre dans un nouvel onglet » |
| **Skip links** | Injecte un lien « Aller au contenu principal » en premier dans le body |
| **Buttons** | Boutons « Ajouter au panier » : ajoute `aria-label` avec le nom du produit |
| **Formulaires** | Associe les `<label>` aux `<input>` via `for`/`id` si manquant, ajoute `aria-required` et `aria-invalid` |
| **Landmarks** | Ajoute `role="main"`, `role="navigation"` et `aria-label` sur main, nav, header, footer |
| **Vidéos** | Audit : signale les vidéos sans sous-titres ; ajoute `aria-label` sur les vidéos sans label |
| **Icônes** | Ajoute `aria-hidden="true"` sur les SVG décoratifs dans boutons/liens |
| **Images** | Audit : signale les images sans attribut `alt` (aucune modification du DOM) |
| **Titres** | Audit : signale les sauts de hiérarchie (h2→h4), h1 manquant ou multiples |

## Panel d'accessibilité visuelle

Activez `accessibilityToolbar: true` pour afficher un bouton flottant (bas-gauche) ouvrant un panel permettant :
- **Type de vision** : Normal, Protanopie, Deutéranopie, Tritanopie, Achromatopsie — adapte les couleurs du site via des filtres CSS/SVG
- **Taille du texte** : boutons + et - pour ajuster de 90 % à 150 %

Les préférences sont sauvegardées dans le localStorage.

```javascript
new AkyosAccessibility({ accessibilityToolbar: true });
```

## Rapport visuel

Activez `visualReport: true` pour afficher un badge avec le score d'accessibilité et un panneau dépliable listant les améliorations et suggestions. Cliquez sur un item pour surligner l'élément concerné. Chaque item affiche sa sévérité (erreur, avertissement, info).

Le bouton **PDF** dans le panneau ouvre une fenêtre d'impression : choisissez « Enregistrer en PDF » pour obtenir un rapport structuré (score, explications, tableaux par catégorie, sévérité, sélecteurs).

```javascript
new AkyosAccessibility({ visualReport: true });
// logReport est désactivé par défaut quand visualReport est activé
```

## Export JSON et intégration CI

### getReportJSON()

Retourne un rapport **sérialisable** (sans références DOM) avec un `selector` CSS pour chaque élément. Idéal pour :

- Pipelines CI (vérifier le score, bloquer si erreurs)
- Envoi à un serveur d'audit
- Stockage ou comparaison entre versions

```javascript
const a11y = new AkyosAccessibility({ visualReport: true });
const json = a11y.getReportJSON();

// Structure du rapport :
// {
//   enhancements: [{ message, source, type, severity, selector }],
//   suggestions: [{ message, source, type, severity, selector }],
//   score: 85,
//   timestamp: "2025-02-17T..."
// }
```

### Callback onReport

Le callback `onReport(report, instance)` est appelé à chaque rapport (au chargement et à chaque mutation du DOM si `watch: true`). Utilisez `instance.getReportJSON()` pour récupérer le JSON sérialisable.

```javascript
new AkyosAccessibility({
  visualReport: true,
  onReport: (report, instance) => {
    const json = instance.getReportJSON();
    // Envoyer à un serveur, logger pour CI, etc.
    fetch('/api/audit', { method: 'POST', body: JSON.stringify(json) });
  },
});
```

## Niveaux de sévérité

Chaque item du rapport possède un champ `severity` pour prioriser les corrections :

| Sévérité | Exemples |
|----------|----------|
| **error** | Images sans `alt`, absence de h1 — bloquant pour l'accessibilité |
| **warning** | Plusieurs h1, saut de hiérarchie (h2→h4), vidéos sans sous-titres |
| **info** | Enhancements appliqués automatiquement (corrections déjà faites) |

## Configuration

```javascript
new AkyosAccessibility({
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
  defaultLang: 'fr',
  productNameSelectors: ['.product-title', 'h2', '[data-product-name]'],
  watch: true,        // Observe le DOM pour le contenu dynamique (SPA)
  logReport: true,    // Affiche le rapport dans la console
  visualReport: false, // Badge + panneau visuel avec score
  onReport: (report, instance) => {}, // Callback à chaque rapport
  accessibilityToolbar: false, // Panel d'accessibilité visuelle (daltonisme, taille du texte)
});
```

## API

### AkyosAccessibility

| Méthode | Description |
|---------|-------------|
| `getReport()` | Retourne le dernier rapport (avec références DOM). Utile pour affichage ou surlignage. |
| `getReportJSON()` | Retourne le rapport sérialisable (sans DOM, avec `selector`). Utile pour CI, audit, export. |
| `destroy()` | Désactive l'observation du DOM (MutationObserver). |

### Structure du rapport

```typescript
interface Report {
  enhancements: ReportItem[];
  suggestions: ReportItem[];
  score: number;      // 0–100
  timestamp: string;  // ISO 8601
}

interface ReportItem {
  message: string;
  source: string;     // ex. "Images (audit)", "Formulaires"
  type: 'enhancement' | 'suggestion';
  severity: 'error' | 'warning' | 'info';
  element?: Element;  // présent dans getReport(), absent dans getReportJSON()
  selector?: string;  // présent dans getReportJSON() uniquement
}
```

## Import granulaire

Vous pouvez importer et exécuter un seul enhancer :

```javascript
import { LangEnhancer } from 'akyos-accessibility/enhancers/lang';
import { ButtonEnhancer } from 'akyos-accessibility/enhancers/button';
import { FormEnhancer } from 'akyos-accessibility/enhancers/form';
import { LandmarkEnhancer } from 'akyos-accessibility/enhancers/landmarks';
import { VideoEnhancer } from 'akyos-accessibility/enhancers/video';
import { IconEnhancer } from 'akyos-accessibility/enhancers/icon';
import { ImageEnhancer } from 'akyos-accessibility/enhancers/image';
import { HeadingEnhancer } from 'akyos-accessibility/enhancers/heading';

new LangEnhancer({ defaultLang: 'fr' }).run();
new ButtonEnhancer({ productNameSelectors: ['.product-name'] }).run();
new FormEnhancer().run();      // labels, aria-required, aria-invalid
new LandmarkEnhancer().run();  // role, aria-label sur landmarks
new VideoEnhancer().run();     // audit vidéos, aria-label
new IconEnhancer().run();      // aria-hidden sur icônes décoratives
new ImageEnhancer().run();     // audit images sans alt
new HeadingEnhancer().run();   // audit hiérarchie des titres
```

## Licence

MIT
