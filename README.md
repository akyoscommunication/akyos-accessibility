# Akyos Accessibility

[![npm version](https://img.shields.io/npm/v/akyos-accessibility.svg)](https://www.npmjs.com/package/akyos-accessibility)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Librairie JavaScript légère qui améliore automatiquement l'accessibilité des sites web. Aucune configuration requise : une seule ligne et les corrections ARIA, labels et skip links sont appliquées. Export JSON, niveaux de sévérité et callback pour intégration CI et audit.

## Table des matières

- [Installation](#installation)
- [Démarrage rapide](#démarrage-rapide)
- [Ce qui est corrigé automatiquement](#ce-qui-est-corrigé-automatiquement)
- [Référentiel RGAA](#référentiel-rgaa)
- [ReadSpeaker (lecteur vocal)](#readspeaker-lecteur-vocal)
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

## Deux modes d'utilisation

| Mode | Usage | Comportement |
|------|-------|--------------|
| **`enhance`** (défaut) | Site en construction | Applique les corrections automatiquement (lang, skip link, labels, etc.) |
| **`audit`** | Audit client | **Ne modifie rien** — génère un rapport professionnel avec points conformes, à corriger et note |

### Mode enhance — pour votre site

```javascript
new AkyosAccessibility({
  mode: 'enhance',
  visualReport: true,
  accessibilityToolbar: true,
});
```

### Mode audit — pour auditer le site d'un client

```javascript
new AkyosAccessibility({
  mode: 'audit',
  visualReport: true,
});
```

En mode audit : aucune modification du DOM, toolbar et ReadSpeaker désactivés par défaut. Le rapport affiche les **points conformes** (déjà en place) et les **suggestions** (à corriger), avec une note et des descriptions de correction.

## Ce qui est corrigé automatiquement

| Enhancer | Action |
|----------|--------|
| **Lang** | Ajoute `lang="fr"` sur `<html>` si manquant |
| **Links** | Liens `target="_blank"` : ajoute `rel="noopener noreferrer"` et `aria-label` avec mention « ouvre dans un nouvel onglet » |
| **Skip links** | Injecte un lien « Aller au contenu principal » en premier dans le body |
| **Buttons** | Boutons « Ajouter au panier » : ajoute `aria-label` avec le nom du produit |
| **Formulaires** | Associe les `<label>` aux `<input>` via `for`/`id` si manquant, ajoute `aria-required`, `aria-invalid` et `autocomplete` (email, tel) |
| **Landmarks** | Ajoute `role="main"`, `role="navigation"` et `aria-label` sur main, nav, header, footer |
| **Vidéos** | Audit : signale les vidéos sans sous-titres ; ajoute `aria-label` sur les vidéos sans label |
| **Icônes** | Ajoute `aria-hidden="true"` sur les SVG décoratifs dans boutons/liens |
| **Images** | Images décoratives détectées → `alt=""` ; audit : images sans `alt` (contenu à décrire manuellement) |
| **Titres** | `role="heading"` sans `aria-level` → `aria-level="2"` ; audit : sauts de hiérarchie, h1 manquant ou multiples |
| **Cadres** | `iframe`/`frame` sans `title` → `title="Contenu embarqué"` |
| **Tableaux** | Tableaux de mise en forme → `role="presentation"` ; en-têtes sans scope → `scope="col"` ou `scope="row"` ; audit : caption, headers |
| **Document** | Audit : signale l'absence ou le vide de `<title>` |
| **Contraste** | Audit : signale les textes dont le contraste avec l'arrière-plan est insuffisant (RGAA 3.2) |
| **Focus** | Injecte des styles `:focus-visible` si des éléments n'ont pas de focus visible ; audit en mode audit |

## Référentiel RGAA

La librairie couvre les critères RGAA automatisables suivants. Chaque point du rapport affiche un lien vers le [référentiel officiel](https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/) pour guider le développeur.

### Ce que la librairie fait

| Thématique RGAA | Critères | Actions |
|-----------------|----------|---------|
| **1. Images** | 1.1, 1.2 | Images décoratives → `alt=""` ; `img` sans `alt`, `input[type="image"]`, `area`, `svg[role="img"]`, `canvas`, `object`, `embed` sans alternative → audit ; SVG décoratifs → `aria-hidden` |
| **2. Cadres** | 2.1 | `iframe` et `frame` sans `title` → `title="Contenu embarqué"` ; audit si mode audit |
| **3. Couleurs** | 3.2 | Contraste texte/arrière-plan (ratio 4.5:1 ou 3:1 selon taille) → audit |
| **4. Médias** | 4.1, 4.3 | Vidéos sans sous-titres ; exige `kind="captions"` ; `<audio>` sans transcription → audit ; `aria-label` sur vidéos |
| **5. Tableaux** | 5.1–5.8 | En-têtes sans scope → `scope="col"` ou `scope="row"` ; tableaux de mise en forme → `role="presentation"` ; caption, headers → audit |
| **6. Liens** | 6.1 | Liens `target="_blank"` → `rel="noopener noreferrer"` + `aria-label` ; liens vides → audit |
| **8. Éléments obligatoires** | 8.5, 8.6 | `lang` sur `<html>` ; `<title>` absent ou vide → audit |
| **9. Structuration** | 9.1, 9.2 | `role="heading"` sans `aria-level` → `aria-level="2"` ; hiérarchie des titres, h1 unique, sauts de niveau, titres vides, plusieurs `<main>` → audit ; landmarks avec `role` et `aria-label` |
| **10. Présentation** | 10.7 | Injection de styles `:focus-visible` si éléments sans focus visible ; audit en mode audit |
| **11. Formulaires** | 11.1–11.11 | Association label/input, `aria-required`, `aria-invalid`, `autocomplete` (email, tel) ; champs sans label ; fieldset sans legend ; optgroup → audit |
| **12. Navigation** | 12.6 | Skip link ; landmarks |

### Ce que la librairie ne fait pas

Ces critères RGAA nécessitent une vérification manuelle ou des outils complémentaires :

| Thématique RGAA | Critères | Raison |
|-----------------|----------|--------|
| **3. Couleurs** | 3.1 | L’information ne doit pas être donnée par la couleur seule — analyse sémantique du contenu |
| **4. Médias** | 4.2, 4.4 | Pertinence des transcriptions et sous-titres — vérification manuelle du contenu multimédia |
| **7. Scripts** | 7.1–7.5 | Comportement des composants JavaScript — vérification manuelle |
| **8. Document** | 8.1, 8.2 | DOCTYPE, validité HTML — nécessite l’analyse du source HTML brut |
| **10. Présentation** | 10.2, 10.3 | Contenu compréhensible sans CSS — nécessite désactivation des feuilles de style |
| **12. Navigation** | 12.1–12.5 | Plan du site, moteur de recherche — structure multi-pages du site |
| **13. Consultation** | 13.1, 13.2 | Limites de temps, pop-ups — comportement dynamique et contextuel |

## ReadSpeaker (lecteur vocal)

ReadSpeaker webReader est un service commercial de synthèse vocale. Une **licence (readerId)** est requise — contactez [ReadSpeaker](https://www.readspeaker.com/) pour obtenir un identifiant client.

L’option `readSpeaker` est **désactivée par défaut** (`false`). Pour l’activer, fournissez un objet de configuration avec votre `readerId` :

```javascript
new AkyosAccessibility({
  readSpeaker: {
    readerId: 'VOTRE_READER_ID',
    lang: 'fr',
    rsConf: { ui: { tools: { translation: false } } }
  }
});
```

| Option | Type | Description |
|--------|------|-------------|
| `readerId` | string | Identifiant client ReadSpeaker (obligatoire) |
| `lang` | string | Langue du lecteur (défaut : `fr`) |
| `rsConf` | object | Configuration passée à `window.rsConf` ([doc ReadSpeaker](https://wrdev.readspeaker.com/configuration-api)) |

Import granulaire :

```javascript
import { loadReadSpeaker } from 'akyos-accessibility';

loadReadSpeaker({ readerId: 'VOTRE_READER_ID', lang: 'fr' });
```

## Panel d'accessibilité visuelle

Activez `accessibilityToolbar: true` pour afficher les boutons flottants (bas-gauche) et le panel permettant :
- **Écouter la page** : bouton « Écouter » (en bas à gauche) pour lire toute la page à voix haute en un clic, avec mise en évidence des mots lus et une zone affichant la phrase en cours en gros (API Web Speech native, sans licence). Le bouton devient « Pause » pendant la lecture. Personnalisation des couleurs de surlignage (fond et texte) dans le panel.
- **Type de vision** : Normal, Protanopie, Deutéranopie, Tritanopie, Achromatopsie — adapte les couleurs du site via des filtres CSS/SVG
- **Taille du texte** : boutons + et - pour ajuster de 90 % à 150 %

Les préférences sont sauvegardées dans le localStorage.

```javascript
new AkyosAccessibility({ accessibilityToolbar: true });
```

## Rapport visuel

Activez `visualReport: true` pour afficher un badge avec le score d'accessibilité et un panneau dépliable listant les améliorations et suggestions. Chaque **amélioration** affiche une **description** expliquant ce qui a été fait ; chaque **suggestion** affiche un **fix** indiquant ce qu'il faut faire. Un lien discret vers le **critère RGAA** (tooltip au survol) guide le développeur vers le référentiel officiel. Les **groupes sont fermés par défaut** — cliquer pour déplier. Cliquez sur un item pour surligner l'élément concerné. Chaque item affiche sa sévérité (erreur, avertissement, info).

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
//   enhancements: [{ message, description, source, type, severity, rgaaRef, selector }],
//   suggestions: [{ message, fix, source, type, severity, rgaaRef, selector }],
//   score: 67,
//   scoreDetails: { enhancements: 10, suggestions: 5, total: 15 },
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
    frames: true,
    tables: true,
    document: true,
    contrast: true,
    focus: true,
  },
  mode: 'enhance',    // 'enhance' : applique les corrections | 'audit' : ne modifie rien, rapport uniquement
  defaultLang: 'fr',
  injectFocusStyles: true, // En mode enhance : injecte des styles :focus-visible si des éléments n'ont pas de focus visible (désactiver si votre CSS gère déjà le focus)
  productNameSelectors: ['.product-title', 'h2', '[data-product-name]'],
  watch: true,        // Observe le DOM pour le contenu dynamique (SPA)
  logReport: true,    // Affiche le rapport dans la console
  visualReport: false, // Badge + panneau visuel avec score
  onReport: (report, instance) => {}, // Callback à chaque rapport
  accessibilityToolbar: false, // Panel d'accessibilité visuelle (daltonisme, taille du texte)
  readSpeaker: false,          // Lecteur vocal ReadSpeaker (readerId requis)
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
  conformant?: ReportItem[];  // Mode audit : points déjà conformes
  score: number;       // 0–100 (taux de conformité en %)
  scoreDetails: {      // Détail du calcul pour transparence
    enhancements: number;
    conformant?: number;
    suggestions: number;
    total: number;
  };
  mode?: 'enhance' | 'audit';
  timestamp: string;    // ISO 8601
}

interface ReportItem {
  message: string;
  fix?: string;       // Ce qu'il faut faire (suggestions)
  description?: string; // Ce qui a été fait (enhancements)
  source: string;     // ex. "Images (audit)", "Formulaires"
  type: 'enhancement' | 'suggestion' | 'conformant';
  severity: 'error' | 'warning' | 'info';
  rgaaRef?: string;   // Référence RGAA (ex. "1.1", "10.7") — lien vers accessibilite.numerique.gouv.fr
  element?: Element;  // présent dans getReport(), absent dans getReportJSON()
  selector?: string;  // présent dans getReportJSON() uniquement
}
```

## Système de notation

Le score d'accessibilité est un **taux de conformité** (0–100 %) calculé ainsi :

```
score = (améliorations appliquées / total des points audités) × 100
```

- **Améliorations** : corrections appliquées automatiquement par la librairie (labels, lang, skip link, etc.)
- **Suggestions** : points nécessitant une correction manuelle (images sans alt, contraste, etc.)
- **Total** : nombre total de points audités (améliorations + suggestions)

**Exemples** : 5 améliorations et 20 suggestions → 5/25 = **20 %** ; 10 améliorations et 5 suggestions → 10/15 = **67 %**

| Note | Plage | Interprétation |
|------|-------|----------------|
| **A** | 90–100 % | Conforme |
| **B** | 75–89 % | Bon |
| **C** | 60–74 % | À améliorer |
| **D** | 40–59 % | Insuffisant |
| **E** | 20–39 % | Critique |
| **F** | 0–19 % | Non conforme |

Le rapport inclut `scoreDetails` pour une traçabilité complète lors des audits clients.

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
import { FrameEnhancer } from 'akyos-accessibility/enhancers/frames';
import { TableEnhancer } from 'akyos-accessibility/enhancers/tables';
import { DocumentEnhancer } from 'akyos-accessibility/enhancers/document';
import { ContrastEnhancer } from 'akyos-accessibility/enhancers/contrast';
import { FocusEnhancer } from 'akyos-accessibility/enhancers/focus';

new LangEnhancer({ defaultLang: 'fr' }).run();
new ButtonEnhancer({ productNameSelectors: ['.product-name'] }).run();
new FormEnhancer().run();       // labels, aria-required, aria-invalid
new LandmarkEnhancer().run();   // role, aria-label sur landmarks
new VideoEnhancer().run();      // audit vidéos, aria-label
new IconEnhancer().run();       // aria-hidden sur icônes décoratives
new ImageEnhancer().run();      // audit images sans alt
new HeadingEnhancer().run();    // audit hiérarchie des titres
new FrameEnhancer().run();      // audit iframe/frame sans title
new TableEnhancer().run();      // tableaux de mise en forme, audit tableaux de données
new DocumentEnhancer().run();   // audit title absent ou vide
new ContrastEnhancer().run();   // audit contraste texte
new FocusEnhancer().run();      // audit focus visible
```

## Licence

MIT
