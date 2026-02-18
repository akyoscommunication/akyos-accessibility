/**
 * Module d'audit multi-pages : interface et logique pour auditer jusqu'à 20 URLs.
 * Récupère le HTML via proxy ou fetch direct, exécute l'audit dans un iframe srcdoc,
 * agrège les rapports et appelle onComplete.
 */

const MESSAGE_TYPE = 'akyos-audit-result';
const STYLES_ID = 'akyos-multipage-audit-styles';

function injectStyles() {
  if (document.getElementById(STYLES_ID)) return;

  const style = document.createElement('style');
  style.id = STYLES_ID;
  style.textContent = `
    .akyos-mpa {
      font-family: system-ui, sans-serif;
      padding: 1.25rem;
      background: #141416;
      border: 1px solid #27272a;
      border-radius: 12px;
      max-width: 560px;
    }
    .akyos-mpa__title {
      margin: 0 0 1rem;
      font-size: 1.125rem;
      font-weight: 600;
      color: #fafafa;
    }
    .akyos-mpa__textarea {
      width: 100%;
      min-height: 120px;
      padding: 0.75rem;
      margin-bottom: 1rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.875rem;
      color: #fafafa;
      background: #0a0a0b;
      border: 1px solid #27272a;
      border-radius: 8px;
      resize: vertical;
      box-sizing: border-box;
    }
    .akyos-mpa__textarea::placeholder {
      color: #71717a;
    }
    .akyos-mpa__textarea:focus {
      outline: none;
      border-color: #22d3ee;
      box-shadow: 0 0 0 2px rgba(34, 211, 238, 0.2);
    }
    .akyos-mpa__hint {
      margin: -0.5rem 0 1rem;
      font-size: 0.75rem;
      color: #71717a;
    }
    .akyos-mpa__actions {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .akyos-mpa__btn {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: #0a0a0b;
      background: #22d3ee;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s, opacity 0.2s;
    }
    .akyos-mpa__btn:hover:not(:disabled) {
      background: #67e8f9;
    }
    .akyos-mpa__btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .akyos-mpa__progress {
      flex: 1;
      min-width: 160px;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .akyos-mpa__progress-bar {
      height: 8px;
      background: #27272a;
      border-radius: 4px;
      overflow: hidden;
    }
    .akyos-mpa__progress-fill {
      height: 100%;
      background: #22d3ee;
      border-radius: 4px;
      transition: width 0.2s;
    }
    .akyos-mpa__progress-text {
      font-size: 0.75rem;
      color: #94a3b8;
    }
  `;
  document.head.appendChild(style);
}

function parseUrls(text, maxUrls) {
  const lines = text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const urls = [];
  for (const line of lines) {
    if (urls.length >= maxUrls) break;
    try {
      const url = new URL(line);
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        urls.push(url.href);
      }
    } catch (_) {
      // Ligne invalide, ignorée
    }
  }
  return urls;
}

function getOrigin(url) {
  try {
    const u = new URL(url);
    return u.origin + '/';
  } catch (_) {
    return '';
  }
}

function stripScripts(html) {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
}

function toAbsoluteScriptUrl(scriptUrl) {
  if (typeof document === 'undefined') return scriptUrl;
  if (scriptUrl.startsWith('http://') || scriptUrl.startsWith('https://')) return scriptUrl;
  try {
    return new URL(scriptUrl, window.location.origin).href;
  } catch (_) {
    return scriptUrl;
  }
}

function buildAuditHtml(html, url, scriptUrl) {
  const strippedHtml = stripScripts(html);
  const absoluteScriptUrl = toAbsoluteScriptUrl(scriptUrl);
  const origin = getOrigin(url);
  const baseTag = origin ? `<base href="${origin.replace(/"/g, '&quot;')}">` : '';
  const metaTag = `<meta name="akyos-audit-url" content="${url.replace(/"/g, '&quot;')}">`;

  const inlineScript = `
(function() {
  var loader = document.getElementById('akyos-audit-loader');
  var meta = document.querySelector('meta[name="akyos-audit-url"]');
  var url = meta ? meta.getAttribute('content') || '' : '';
  function run() {
    if (typeof AkyosAccessibility === 'undefined') return;
    try {
      var a11y = new AkyosAccessibility({ mode: 'audit', watch: false, excludeAkyosUI: true });
      var report = a11y.getReportJSON();
      parent.postMessage({ type: '${MESSAGE_TYPE}', url: url, report: report }, '*');
    } catch (e) {
      parent.postMessage({ type: '${MESSAGE_TYPE}', url: url, report: null, error: String(e.message) }, '*');
    }
  }
  if (loader) {
    if (typeof AkyosAccessibility !== 'undefined') run();
    else loader.addEventListener('load', run);
  } else {
    run();
  }
})();
`;

  const bodyEnd = strippedHtml.includes('</body>')
    ? strippedHtml.replace(
        '</body>',
        `${baseTag}${metaTag}<script src="${absoluteScriptUrl.replace(/"/g, '&quot;')}" id="akyos-audit-loader"><\\/script><script>${inlineScript}<\\/script></body>`
      )
    : strippedHtml + baseTag + metaTag + `<script src="${absoluteScriptUrl.replace(/"/g, '&quot;')}" id="akyos-audit-loader"></script><script>${inlineScript}</script>`;

  return bodyEnd;
}

function isSameOrigin(url) {
  if (typeof window === 'undefined') return false;
  try {
    const u = new URL(url);
    return u.origin === window.location.origin;
  } catch (_) {
    return false;
  }
}

function auditUrlSameOrigin(url, scriptUrl, timeout) {
  return new Promise((resolve) => {
    const absoluteScriptUrl = toAbsoluteScriptUrl(scriptUrl);
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:absolute;width:1px;height:1px;border:none;opacity:0;pointer-events:none;';
    iframe.src = url;

    const timeoutId = setTimeout(() => {
      cleanup();
      resolve({ url, report: null, status: 'error', error: 'Timeout dépassé' });
    }, timeout);

    const handler = (event) => {
      if (event.data?.type !== MESSAGE_TYPE || event.data?.url !== url) return;
      cleanup();
      resolve({
        url,
        report: event.data.report,
        status: event.data.error ? 'error' : 'ok',
        error: event.data.error,
      });
    };

    const cleanup = () => {
      clearTimeout(timeoutId);
      window.removeEventListener('message', handler);
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    };

    const injectAndRun = () => {
      try {
        const doc = iframe.contentDocument;
        if (!doc || !doc.body) return;
        const s1 = doc.createElement('script');
        s1.src = absoluteScriptUrl;
        s1.id = 'akyos-audit-loader';
        s1.onload = () => {
          const s2 = doc.createElement('script');
          const urlEscaped = JSON.stringify(url);
          s2.textContent = `
            try {
              var a11y = new AkyosAccessibility({ mode: 'audit', watch: false, excludeAkyosUI: true });
              var report = a11y.getReportJSON();
              parent.postMessage({ type: '${MESSAGE_TYPE}', url: ${urlEscaped}, report: report }, '*');
            } catch (e) {
              parent.postMessage({ type: '${MESSAGE_TYPE}', url: ${urlEscaped}, report: null, error: String(e.message) }, '*');
            }
          `;
          doc.body.appendChild(s2);
        };
        s1.onerror = () => {
          cleanup();
          resolve({ url, report: null, status: 'error', error: 'Échec du chargement du script d\'audit' });
        };
        doc.body.appendChild(s1);
      } catch (e) {
        cleanup();
        resolve({ url, report: null, status: 'error', error: e.message || 'Accès iframe refusé' });
      }
    };

    iframe.onload = () => {
      if (iframe.contentWindow?.location?.href === 'about:blank') return;
      injectAndRun();
    };

    window.addEventListener('message', handler);
    document.body.appendChild(iframe);
  });
}

function auditUrl(html, url, scriptUrl, timeout) {
  if (isSameOrigin(url)) {
    return auditUrlSameOrigin(url, scriptUrl, timeout);
  }
  return new Promise((resolve) => {
    const fullHtml = buildAuditHtml(html, url, scriptUrl);
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:absolute;width:1px;height:1px;border:none;opacity:0;pointer-events:none;';
    iframe.srcdoc = fullHtml;

    const timeoutId = setTimeout(() => {
      cleanup();
      resolve({ url, report: null, status: 'error', error: 'Timeout dépassé' });
    }, timeout);

    const handler = (event) => {
      if (event.data?.type !== MESSAGE_TYPE || event.data?.url !== url) return;
      cleanup();
      resolve({
        url,
        report: event.data.report,
        status: event.data.error ? 'error' : 'ok',
        error: event.data.error,
      });
    };

    const cleanup = () => {
      clearTimeout(timeoutId);
      window.removeEventListener('message', handler);
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    };

    window.addEventListener('message', handler);
    document.body.appendChild(iframe);
  });
}

function fetchHtml(url, proxyUrl) {
  const fetchUrl = proxyUrl
    ? `${proxyUrl}${proxyUrl.includes('?') ? '&' : '?'}url=${encodeURIComponent(url)}`
    : url;
  return fetch(fetchUrl).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.text();
  });
}

/**
 * Rend l'interface d'audit multi-pages dans le container.
 * @param {HTMLElement} container - Élément DOM où afficher l'interface
 * @param {Object} [options={}] - Configuration
 * @param {number} [options.maxUrls=20] - Nombre max d'URLs à auditer
 * @param {string} [options.proxyUrl] - URL du proxy pour fetch cross-origin (GET ?url=...)
 * @param {string} options.scriptUrl - URL du bundle audit-runner (IIFE) pour l'iframe
 * @param {function} [options.onComplete] - Callback (aggregatedReport) => void
 * @param {number} [options.timeout=15000] - Timeout en ms par page
 */
export function renderMultiPageAudit(container, options = {}) {
  if (typeof document === 'undefined' || !container) return;

  const {
    maxUrls = 20,
    proxyUrl,
    scriptUrl,
    onComplete,
    timeout = 15000,
  } = options;

  if (!scriptUrl) {
    console.warn('[Akyos Accessibility] renderMultiPageAudit: scriptUrl est requis.');
    return;
  }

  injectStyles();

  const wrapper = document.createElement('div');
  wrapper.className = 'akyos-mpa';
  wrapper.innerHTML = `
    <h3 class="akyos-mpa__title">Audit multi-pages</h3>
    <textarea class="akyos-mpa__textarea" placeholder="https://example.com/page1\nhttps://example.com/page2\n..." rows="5"></textarea>
    <p class="akyos-mpa__hint">Une URL par ligne. Maximum ${maxUrls} pages.</p>
    <div class="akyos-mpa__actions">
      <button type="button" class="akyos-mpa__btn" id="akyos-mpa-btn">Commencer l'audit</button>
      <div class="akyos-mpa__progress" id="akyos-mpa-progress" hidden>
        <div class="akyos-mpa__progress-bar">
          <div class="akyos-mpa__progress-fill" id="akyos-mpa-progress-fill" style="width: 0%"></div>
        </div>
        <span class="akyos-mpa__progress-text" id="akyos-mpa-progress-text">0/0 (0%)</span>
      </div>
    </div>
  `;

  container.innerHTML = '';
  container.appendChild(wrapper);

  const textarea = wrapper.querySelector('.akyos-mpa__textarea');
  const btn = wrapper.querySelector('#akyos-mpa-btn');
  const progressWrap = wrapper.querySelector('#akyos-mpa-progress');
  const progressFill = wrapper.querySelector('#akyos-mpa-progress-fill');
  const progressText = wrapper.querySelector('#akyos-mpa-progress-text');

  const updateProgress = (current, total) => {
    const percent = total > 0 ? Math.round((current / total) * 100) : 0;
    progressFill.style.width = `${percent}%`;
    progressText.textContent = `${current}/${total} (${percent}%)`;
  };

  btn.addEventListener('click', async () => {
    const urls = parseUrls(textarea.value, maxUrls);
    if (urls.length === 0) {
      alert('Veuillez saisir au moins une URL valide (une par ligne).');
      return;
    }

    btn.disabled = true;
    progressWrap.hidden = false;
    updateProgress(0, urls.length);

    const pages = [];
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      try {
        const html = await fetchHtml(url, proxyUrl);
        const result = await auditUrl(html, url, scriptUrl, timeout);
        pages.push(result);
      } catch (err) {
        pages.push({
          url,
          report: null,
          status: 'error',
          error: err.message || String(err),
        });
      }
      updateProgress(i + 1, urls.length);
    }

    const completed = pages.filter((p) => p.status === 'ok').length;
    const failed = pages.length - completed;
    const scores = pages.filter((p) => p.report?.score != null).map((p) => p.report.score);
    const averageScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    const aggregatedReport = {
      pages,
      summary: {
        totalPages: urls.length,
        completed,
        failed,
        averageScore,
        timestamp: new Date().toISOString(),
      },
    };

    if (typeof onComplete === 'function') {
      onComplete(aggregatedReport);
    }
    console.log('Akyos Accessibility - Rapport multi-pages:', aggregatedReport);

    btn.disabled = false;
  });
}
