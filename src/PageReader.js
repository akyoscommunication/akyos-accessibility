/**
 * Lecteur vocal de page : utilise l'API Web Speech pour lire le contenu
 * avec mise en évidence des mots lus. Fonctionne sans licence (natif au navigateur).
 */

const WORD_SPAN_CLASS = 'akyos-reader-word';
const ACTIVE_CLASS = 'akyos-reader-word--active';
const STYLE_ID = 'akyos-reader-styles';
const PHRASE_OVERLAY_ID = 'akyos-reader-phrase-overlay';

let currentReader = null;

function buildPhraseRanges(text) {
  const ranges = [];
  const regex = /[.!?]\s+|\n+/g;
  let lastEnd = 0;
  let m;
  while ((m = regex.exec(text)) !== null) {
    const end = m.index + m[0].length;
    const phrase = text.slice(lastEnd, end).trim();
    if (phrase) ranges.push({ start: lastEnd, end, text: phrase });
    lastEnd = end;
  }
  if (lastEnd < text.length) {
    const phrase = text.slice(lastEnd).trim();
    if (phrase) ranges.push({ start: lastEnd, end: text.length, text: phrase });
  }
  if (ranges.length === 0 && text) {
    ranges.push({ start: 0, end: text.length, text });
  }
  return ranges;
}

function getSpansForRange(charsToSpans, rangeStart, rangeEnd) {
  return charsToSpans.filter(
    (item) => item.start < rangeEnd && item.end > rangeStart
  ).map((item) => item.span);
}

function createPhraseOverlay() {
  let el = document.getElementById(PHRASE_OVERLAY_ID);
  if (el) return el;
  el = document.createElement('div');
  el.id = PHRASE_OVERLAY_ID;
  el.className = 'akyos-reader-phrase-overlay';
  el.setAttribute('aria-live', 'polite');
  el.setAttribute('aria-atomic', 'true');
  el.setAttribute('role', 'status');
  const style = document.createElement('style');
  style.id = 'akyos-reader-phrase-overlay-styles';
  style.textContent = `
    .akyos-reader-phrase-overlay {
      position: fixed;
      bottom: 4.5rem;
      left: 50%;
      transform: translateX(-50%);
      max-width: min(90vw, 600px);
      padding: 1.25rem 1.5rem;
      background: rgba(20, 20, 22, 0.95);
      border: 1px solid #27272a;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      font-family: system-ui, sans-serif;
      font-size: 1.35rem;
      line-height: 1.5;
      color: #fafafa;
      text-align: center;
      z-index: 99994;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s, visibility 0.2s;
    }
    .akyos-reader-phrase-overlay.akyos-reader-phrase-overlay--visible {
      opacity: 1;
      visibility: visible;
    }
  `;
  if (!document.getElementById(style.id)) document.head.appendChild(style);
  document.body.appendChild(el);
  return el;
}

function showPhraseOverlay(text) {
  const el = document.getElementById(PHRASE_OVERLAY_ID);
  if (el) {
    el.textContent = text;
    el.classList.add('akyos-reader-phrase-overlay--visible');
  }
}

function hidePhraseOverlay() {
  const el = document.getElementById(PHRASE_OVERLAY_ID);
  if (el) {
    el.classList.remove('akyos-reader-phrase-overlay--visible');
    el.textContent = '';
  }
}

function getMainContent() {
  const main = document.querySelector('main, [role="main"]');
  return main || document.body;
}

function wrapWordsInSpans(container) {
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const text = node.textContent?.trim();
        if (!text) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tag = parent.tagName?.toLowerCase();
        if (['script', 'style', 'noscript', 'svg'].includes(tag)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    },
    false
  );

  const textNodes = [];
  let n;
  while ((n = walker.nextNode())) textNodes.push(n);

  const wordSpans = [];
  textNodes.forEach((node) => {
    const text = node.textContent;
    const words = text.split(/(\s+)/);
    const fragment = document.createDocumentFragment();

    words.forEach((word) => {
      if (/^\s+$/.test(word)) {
        fragment.appendChild(document.createTextNode(word));
      } else if (word) {
        const span = document.createElement('span');
        span.className = WORD_SPAN_CLASS;
        span.textContent = word;
        span.dataset.readerWord = '1';
        wordSpans.push(span);
        fragment.appendChild(span);
      }
    });

    node.parentNode.replaceChild(fragment, node);
  });

  return wordSpans;
}

function buildCharToSpanMapping(container) {
  const mapping = [];
  let idx = 0;

  function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      idx += (node.textContent || '').length;
      return;
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.classList && node.classList.contains(WORD_SPAN_CLASS)) {
        const text = node.textContent || '';
        mapping.push({ start: idx, end: idx + text.length, span: node });
        idx += text.length;
        return;
      }
      for (let i = 0; i < node.childNodes.length; i++) {
        walk(node.childNodes[i]);
      }
    }
  }

  walk(container);
  return mapping;
}

function clearHighlights(spans) {
  spans.forEach((s) => s.classList.remove(ACTIVE_CLASS));
}

function injectHighlightStyles(highlightBg, highlightColor) {
  let style = document.getElementById(STYLE_ID);
  if (!style) {
    style = document.createElement('style');
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = `
    .${WORD_SPAN_CLASS} {
      transition: background-color 0.1s, color 0.1s;
    }
    .${WORD_SPAN_CLASS}.${ACTIVE_CLASS} {
      background-color: ${highlightBg || '#fef08a'} !important;
      color: ${highlightColor || '#1a1a1a'} !important;
      border-radius: 2px;
    }
  `;
}

function restoreOriginalDOM(spans) {
  spans.forEach((span) => {
    const text = document.createTextNode(span.textContent);
    span.parentNode.replaceChild(text, span);
  });
}

/**
 * Lit le contenu de la page avec mise en évidence des mots.
 * @param {Object} options
 * @param {string} [options.highlightBg='#fef08a'] - Couleur de fond de surlignage
 * @param {string} [options.highlightColor='#1a1a1a'] - Couleur du texte surligné
 * @param {string} [options.lang='fr-FR'] - Langue de synthèse
 * @param {function} [options.onStart] - Callback au démarrage
 * @param {function} [options.onEnd] - Callback à la fin
 * @param {function} [options.onStateChange] - Callback (state: 'playing'|'paused'|'stopped') => void
 * @param {boolean} [options.showPhraseOverlay=true] - Afficher une zone avec la phrase en cours en gros pendant l'écoute
 * @returns {Object} - { stop: () => void, pause: () => void, resume: () => void, isPaused: () => boolean }
 */
export function readPage(options = {}) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[Akyos Accessibility] L\'API Speech Synthesis n\'est pas disponible.');
    }
    return { stop: () => {}, pause: () => {}, resume: () => {}, isPaused: () => false };
  }

  if (currentReader) {
    currentReader.stop();
  }

  const highlightBg = options.highlightBg || '#fef08a';
  const highlightColor = options.highlightColor || '#1a1a1a';
  const lang = options.lang || 'fr-FR';
  const showPhraseOverlayOption = options.showPhraseOverlay !== false;

  injectHighlightStyles(highlightBg, highlightColor);

  const container = getMainContent();
  const wordSpans = wrapWordsInSpans(container);
  const fullText = (container.textContent || '').trim();

  if (!fullText) {
    restoreOriginalDOM(wordSpans);
    if (typeof options.onEnd === 'function') options.onEnd();
    return { stop: () => {}, pause: () => {}, resume: () => {}, isPaused: () => false };
  }

  let cancelled = false;
  let paused = false;
  let currentPhraseIndex = -1;

  const notifyState = (state) => {
    if (typeof options.onStateChange === 'function') options.onStateChange(state);
  };

  const stop = () => {
    cancelled = true;
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    clearHighlights(wordSpans);
    restoreOriginalDOM(wordSpans);
    currentReader = null;
    paused = false;
    hidePhraseOverlay();
    notifyState('stopped');
    if (typeof options.onEnd === 'function') options.onEnd();
  };

  const pause = () => {
    if (cancelled || !window.speechSynthesis) return;
    window.speechSynthesis.pause();
    clearHighlights(wordSpans);
    hidePhraseOverlay();
    paused = true;
    notifyState('paused');
  };

  const resume = () => {
    if (cancelled || !window.speechSynthesis) return;
    window.speechSynthesis.resume();
    if (currentPhraseIndex >= 0 && currentPhraseIndex < phraseRanges.length) {
      highlightPhrase(currentPhraseIndex);
    }
    paused = false;
    notifyState('playing');
  };

  currentReader = { stop, pause, resume, isPaused: () => paused };

  const charsToSpans = buildCharToSpanMapping(container);
  const phraseRanges = buildPhraseRanges(fullText);

  if (showPhraseOverlayOption) {
    createPhraseOverlay();
  }

  const highlightPhrase = (phraseIndex) => {
    clearHighlights(wordSpans);
    const range = phraseRanges[phraseIndex];
    if (!range) return;
    const spans = getSpansForRange(charsToSpans, range.start, range.end);
    spans.forEach((span) => span.classList.add(ACTIVE_CLASS));
    if (spans[0]) {
      try {
        spans[0].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } catch (_) {}
    }
    if (showPhraseOverlayOption) {
      showPhraseOverlay(range.text);
    }
  };

  const finish = () => {
    if (cancelled) return;
    clearHighlights(wordSpans);
    restoreOriginalDOM(wordSpans);
    currentReader = null;
    hidePhraseOverlay();
    notifyState('stopped');
    if (typeof options.onEnd === 'function') options.onEnd();
  };

  if (typeof options.onStart === 'function') options.onStart();

  if (phraseRanges.length === 0) {
    finish();
    return { stop: () => {}, pause: () => {}, resume: () => {}, isPaused: () => false };
  }

  const speakNext = (index) => {
    if (cancelled || index >= phraseRanges.length) {
      if (index >= phraseRanges.length) finish();
      return;
    }
    currentPhraseIndex = index;
    const range = phraseRanges[index];
    highlightPhrase(index);

    const utt = new SpeechSynthesisUtterance(range.text);
    utt.lang = lang;
    utt.rate = 0.95;

    utt.onend = () => {
      if (cancelled) return;
      clearHighlights(wordSpans);
      speakNext(index + 1);
    };

    utt.onerror = () => {
      if (cancelled) return;
      speakNext(index + 1);
    };

    window.speechSynthesis.speak(utt);
  };

  window.speechSynthesis.cancel();
  speakNext(0);
  notifyState('playing');

  return { stop, pause, resume, isPaused: () => paused };
}

/**
 * Vérifie si l'API Speech Synthesis est disponible.
 */
export function isPageReaderAvailable() {
  return typeof window !== 'undefined' && !!window.speechSynthesis;
}
