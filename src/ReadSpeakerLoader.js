/**
 * Charge le script ReadSpeaker webReader de manière conditionnelle.
 * ReadSpeaker est un service commercial ; un readerId (licence) est requis.
 *
 * @param {boolean|object} [options] - Configuration ReadSpeaker
 *   - false | undefined : ne rien faire
 *   - true : readerId manquant, pas de chargement
 *   - { readerId: string, lang?: string, rsConf?: object } : config complète
 */

const READSPEAKER_SCRIPT_ID = 'akyos-readspeaker-script';

export function loadReadSpeaker(options) {
  if (typeof document === 'undefined' || typeof document.head === 'undefined') {
    return;
  }

  if (options === false || options === undefined) {
    return;
  }

  if (options === true) {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn(
        '[Akyos Accessibility] readSpeaker: true nécessite un readerId. Utilisez readSpeaker: { readerId: "xxx" }.'
      );
    }
    return;
  }

  const readerId =
    options && typeof options === 'object' && typeof options.readerId === 'string'
      ? options.readerId.trim()
      : '';

  if (!readerId) {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[Akyos Accessibility] readSpeaker: readerId manquant. ReadSpeaker non chargé.');
    }
    return;
  }

  if (document.getElementById(READSPEAKER_SCRIPT_ID)) {
    return;
  }

  const lang = (options.lang && typeof options.lang === 'string' ? options.lang : 'fr').trim();
  const rsConf = options.rsConf && typeof options.rsConf === 'object' ? options.rsConf : {};

  if (Object.keys(rsConf).length > 0 && typeof window !== 'undefined') {
    window.rsConf = { ...(window.rsConf || {}), ...rsConf };
  }

  const script = document.createElement('script');
  script.id = READSPEAKER_SCRIPT_ID;
  script.src = `https://cdn1.readspeaker.com/script/${encodeURIComponent(readerId)}/webReader/webReader.js?pID=${encodeURIComponent(readerId)}&pLang=${encodeURIComponent(lang)}`;
  script.async = true;

  document.head.appendChild(script);
}
