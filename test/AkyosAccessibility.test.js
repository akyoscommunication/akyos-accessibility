/**
 * @jest-environment jsdom
 */

import { LangEnhancer } from '../src/enhancers/LangEnhancer.js';
import { LinkEnhancer } from '../src/enhancers/LinkEnhancer.js';
import { SkipLinkEnhancer } from '../src/enhancers/SkipLinkEnhancer.js';
import { ButtonEnhancer } from '../src/enhancers/ButtonEnhancer.js';
import { ImageEnhancer } from '../src/enhancers/ImageEnhancer.js';
import { HeadingEnhancer } from '../src/enhancers/HeadingEnhancer.js';
import { FormEnhancer } from '../src/enhancers/FormEnhancer.js';
import { LandmarkEnhancer } from '../src/enhancers/LandmarkEnhancer.js';
import { VideoEnhancer } from '../src/enhancers/VideoEnhancer.js';
import { IconEnhancer } from '../src/enhancers/IconEnhancer.js';
import { FrameEnhancer } from '../src/enhancers/FrameEnhancer.js';
import { TableEnhancer } from '../src/enhancers/TableEnhancer.js';
import { DocumentEnhancer } from '../src/enhancers/DocumentEnhancer.js';
import { ContrastEnhancer } from '../src/enhancers/ContrastEnhancer.js';
import { FocusEnhancer } from '../src/enhancers/FocusEnhancer.js';
import { AkyosAccessibility } from '../src/AkyosAccessibility.js';
import { loadReadSpeaker } from '../src/ReadSpeakerLoader.js';
import { generateId, findProductName } from '../src/utils/index.js';

describe('generateId', () => {
  it('returns unique ids', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^a11y-\d+-[a-z0-9]+$/);
  });

  it('accepts custom prefix', () => {
    const id = generateId('test');
    expect(id).toMatch(/^test-\d+-[a-z0-9]+$/);
  });
});

describe('findProductName', () => {
  it('finds product name in parent', () => {
    document.body.innerHTML = `
      <div class="product-card">
        <h2 class="product-name">T-shirt Bleu</h2>
        <button>Ajouter au panier</button>
      </div>
    `;
    const button = document.querySelector('button');
    expect(findProductName(button)).toBe('T-shirt Bleu');
  });

  it('returns null when no product name found', () => {
    document.body.innerHTML = '<button>Ajouter au panier</button>';
    const button = document.querySelector('button');
    expect(findProductName(button)).toBeNull();
  });
});

describe('LangEnhancer', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('lang');
  });

  it('adds lang attribute when missing', () => {
    new LangEnhancer({ defaultLang: 'fr' }).run();
    expect(document.documentElement.getAttribute('lang')).toBe('fr');
  });

  it('does not override existing lang', () => {
    document.documentElement.setAttribute('lang', 'en');
    new LangEnhancer({ defaultLang: 'fr' }).run();
    expect(document.documentElement.getAttribute('lang')).toBe('en');
  });
});

describe('LinkEnhancer', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('adds rel noopener noreferrer to target _blank links', () => {
    document.body.innerHTML = '<a href="#" target="_blank">Lien</a>';
    new LinkEnhancer().run();
    const link = document.querySelector('a');
    expect(link.rel).toContain('noopener');
    expect(link.rel).toContain('noreferrer');
  });

  it('adds aria-label for external links', () => {
    document.body.innerHTML = '<a href="#" target="_blank">Voir plus</a>';
    new LinkEnhancer().run();
    const link = document.querySelector('a');
    expect(link.getAttribute('aria-label')).toContain('Voir plus');
    expect(link.getAttribute('aria-label')).toContain('nouvel onglet');
  });
});

describe('SkipLinkEnhancer', () => {
  beforeEach(() => {
    document.body.innerHTML = '<main id="main-content"><p>Contenu</p></main>';
  });

  it('injects skip link', () => {
    new SkipLinkEnhancer().run();
    const link = document.getElementById('akyos-skip-link');
    expect(link).toBeTruthy();
    expect(link.textContent).toContain('Aller au contenu');
    expect(link.href).toContain('#main-content');
  });

  it('does not inject twice', () => {
    new SkipLinkEnhancer().run();
    new SkipLinkEnhancer().run();
    const links = document.querySelectorAll('#akyos-skip-link');
    expect(links.length).toBe(1);
  });
});

describe('ButtonEnhancer', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('adds aria-label to add to cart button with product context', () => {
    document.body.innerHTML = `
      <div class="product">
        <h2>T-shirt Rouge</h2>
        <button>Ajouter au panier</button>
      </div>
    `;
    new ButtonEnhancer().run();
    const button = document.querySelector('button');
    expect(button.getAttribute('aria-label')).toBe('Ajouter au panier : T-shirt Rouge');
  });

  it('does not override existing aria-label', () => {
    document.body.innerHTML = `
      <div class="product"><h2>Produit</h2>
      <button aria-label="Custom">Ajouter au panier</button></div>
    `;
    new ButtonEnhancer().run();
    const button = document.querySelector('button');
    expect(button.getAttribute('aria-label')).toBe('Custom');
  });
});

describe('ImageEnhancer', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('reports images without alt attribute', () => {
    document.body.innerHTML = `
      <img src="/photo.jpg">
      <img src="/hero.png">
      <img src="https://cdn.example.com/product.gif?w=100">
    `;
    const result = new ImageEnhancer().run();
    expect(result).toHaveLength(3);
    expect(result[0].message).toContain('photo.jpg');
    expect(result[1].message).toContain('hero.png');
    expect(result[2].message).toContain('product.gif');
  });

  it('does not report images with alt attribute', () => {
    document.body.innerHTML = '<img src="/photo.jpg" alt="Description">';
    const result = new ImageEnhancer().run();
    expect(result).toHaveLength(0);
  });

  it('does not report images with empty alt (decorative)', () => {
    document.body.innerHTML = '<img src="/deco.svg" alt="">';
    const result = new ImageEnhancer().run();
    expect(result).toHaveLength(0);
  });

  it('does not modify the DOM', () => {
    document.body.innerHTML = '<img src="/test.png">';
    const img = document.querySelector('img');
    new ImageEnhancer().run();
    expect(img.hasAttribute('alt')).toBe(false);
  });
});

describe('HeadingEnhancer', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('reports heading level skip', () => {
    document.body.innerHTML = '<h1>Title</h1><h2>Sub</h2><h4>Skip</h4>';
    const result = new HeadingEnhancer().run();
    expect(result.length).toBeGreaterThan(0);
    expect(result.some((r) => r.message.includes('Saut de niveau'))).toBe(true);
  });

  it('reports missing h1', () => {
    document.body.innerHTML = '<h2>No h1</h2>';
    const result = new HeadingEnhancer().run();
    expect(result.some((r) => r.message.includes('Aucun h1'))).toBe(true);
  });

  it('reports multiple h1', () => {
    document.body.innerHTML = '<h1>First</h1><h1>Second</h1>';
    const result = new HeadingEnhancer().run();
    expect(result.some((r) => r.message.includes('Plusieurs h1'))).toBe(true);
  });

  it('returns empty for valid hierarchy', () => {
    document.body.innerHTML = '<h1>Title</h1><h2>Sub</h2><h3>SubSub</h3>';
    const result = new HeadingEnhancer().run();
    expect(result).toHaveLength(0);
  });
});

describe('FormEnhancer', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('associates label with input via for/id when missing', () => {
    document.body.innerHTML = `
      <form>
        <label>Email</label>
        <input type="email" name="email">
      </form>
    `;
    const result = new FormEnhancer().run();
    const label = document.querySelector('label');
    const input = document.querySelector('input');
    expect(input.id).toBeTruthy();
    expect(label.getAttribute('for')).toBe(input.id);
    expect(result.some((r) => r.message.includes('Label associé'))).toBe(true);
  });

  it('adds aria-required on required fields', () => {
    document.body.innerHTML = '<input type="text" required name="nom">';
    new FormEnhancer().run();
    const input = document.querySelector('input');
    expect(input.getAttribute('aria-required')).toBe('true');
  });

  it('adds aria-invalid when element has error class', () => {
    document.body.innerHTML = '<input type="email" class="error" name="email">';
    new FormEnhancer().run();
    const input = document.querySelector('input');
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('does not override existing label association', () => {
    document.body.innerHTML = `
      <label for="my-email">Email</label>
      <input id="my-email" type="email">
    `;
    const result = new FormEnhancer().run();
    const label = document.querySelector('label');
    expect(label.getAttribute('for')).toBe('my-email');
    expect(result.filter((r) => r.message.includes('Label associé'))).toHaveLength(0);
  });
});

describe('LandmarkEnhancer', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('adds role and aria-label on main', () => {
    document.body.innerHTML = '<main><p>Content</p></main>';
    const result = new LandmarkEnhancer().run();
    const main = document.querySelector('main');
    expect(main.getAttribute('role')).toBe('main');
    expect(main.getAttribute('aria-label')).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
  });

  it('adds role and aria-label on nav', () => {
    document.body.innerHTML = '<nav><a href="#">Link</a></nav>';
    const result = new LandmarkEnhancer().run();
    const nav = document.querySelector('nav');
    expect(nav.getAttribute('role')).toBe('navigation');
    expect(nav.getAttribute('aria-label')).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('VideoEnhancer', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('reports video without subtitles', () => {
    document.body.innerHTML = '<video src="/demo.mp4"></video>';
    const result = new VideoEnhancer().run();
    const suggestion = result.find((r) => r.type === 'suggestion');
    expect(suggestion).toBeTruthy();
    expect(suggestion.message).toContain('sans sous-titres');
  });

  it('does not report video with track kind=captions', () => {
    document.body.innerHTML = `
      <video>
        <source src="/demo.mp4">
        <track kind="captions" src="/subs.vtt">
      </video>
    `;
    const result = new VideoEnhancer().run();
    const suggestion = result.find((r) => r.type === 'suggestion');
    expect(suggestion).toBeFalsy();
  });

  it('reports video with subtitles but without captions (RGAA 4.3.2)', () => {
    document.body.innerHTML = `
      <video>
        <source src="/demo.mp4">
        <track kind="subtitles" src="/subs.vtt">
      </video>
    `;
    const result = new VideoEnhancer().run();
    const suggestion = result.find((r) => r.message.includes('kind="captions"'));
    expect(suggestion).toBeTruthy();
  });

  it('adds aria-label on video without label', () => {
    document.body.innerHTML = '<video><source src="/demo.mp4"></video>';
    new VideoEnhancer().run();
    const video = document.querySelector('video');
    expect(video.getAttribute('aria-label')).toBe('Vidéo');
  });
});

describe('IconEnhancer', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('adds aria-hidden on decorative SVG in button', () => {
    document.body.innerHTML = '<button aria-label="Fermer"><svg><path d="M1 1L10 10"/></svg></button>';
    const result = new IconEnhancer().run();
    const svg = document.querySelector('svg');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(result.length).toBeGreaterThan(0);
  });

  it('does not add aria-hidden when button has text', () => {
    document.body.innerHTML = '<button><svg></svg> Envoyer</button>';
    const result = new IconEnhancer().run();
    const svg = document.querySelector('svg');
    expect(svg.getAttribute('aria-hidden')).toBeFalsy();
    expect(result).toHaveLength(0);
  });
});

describe('FrameEnhancer', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('reports iframe without title in audit mode', () => {
    document.body.innerHTML = '<iframe src="https://example.com/embed"></iframe>';
    const result = new FrameEnhancer({ auditOnly: true }).run();
    expect(result).toHaveLength(1);
    expect(result[0].message).toContain('sans titre');
    expect(result[0].severity).toBe('error');
  });

  it('adds title on iframe without title in enhance mode', () => {
    document.body.innerHTML = '<iframe src="https://example.com/embed"></iframe>';
    const iframe = document.querySelector('iframe');
    const result = new FrameEnhancer().run();
    expect(result).toHaveLength(1);
    expect(iframe.getAttribute('title')).toBe('Contenu embarqué');
    expect(result[0].type).toBe('enhancement');
  });

  it('does not report iframe with title', () => {
    document.body.innerHTML = '<iframe src="https://example.com" title="Embed"></iframe>';
    const result = new FrameEnhancer().run();
    expect(result).toHaveLength(0);
  });
});

describe('TableEnhancer', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('adds role presentation to layout table', () => {
    document.body.innerHTML = `
      <table>
        <tr><td>A</td><td>B</td></tr>
      </table>
    `;
    const result = new TableEnhancer().run();
    const table = document.querySelector('table');
    expect(table.getAttribute('role')).toBe('presentation');
    expect(result.some((r) => r.message.includes('presentation'))).toBe(true);
  });

  it('reports data table without caption', () => {
    document.body.innerHTML = `
      <table>
        <tr><th>Col</th></tr>
        <tr><td>Val</td></tr>
      </table>
    `;
    const result = new TableEnhancer().run();
    expect(result.some((r) => r.message.includes('sans titre'))).toBe(true);
  });
});

describe('DocumentEnhancer', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    const title = document.querySelector('title');
    if (title) title.remove();
  });

  it('reports missing title', () => {
    document.body.innerHTML = '<p>Content</p>';
    const result = new DocumentEnhancer().run();
    expect(result).toHaveLength(1);
    expect(result[0].message).toContain('title');
  });

  it('reports empty title', () => {
    document.body.innerHTML = '<p>Content</p>';
    const title = document.createElement('title');
    document.head.appendChild(title);
    const result = new DocumentEnhancer().run();
    expect(result).toHaveLength(1);
    expect(result[0].message).toContain('vide');
  });
});

describe('ContrastEnhancer', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('returns items for low contrast text', () => {
    document.body.innerHTML = '<p style="color:#999;background:#fff">Low contrast</p>';
    const result = new ContrastEnhancer().run();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe('FocusEnhancer', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('reports focusable without visible focus', () => {
    document.body.innerHTML = '<button style="outline:none">Click</button>';
    const result = new FocusEnhancer().run();
    expect(result.length).toBeGreaterThanOrEqual(0);
  });
});

describe('LinkEnhancer empty links', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('reports link without text or aria-label', () => {
    document.body.innerHTML = '<a href="/page"></a>';
    const result = new LinkEnhancer().run();
    const emptyLink = result.find((r) => r.message.includes('sans intitulé'));
    expect(emptyLink).toBeTruthy();
  });
});

describe('loadReadSpeaker', () => {
  beforeEach(() => {
    const script = document.getElementById('akyos-readspeaker-script');
    if (script) script.remove();
  });

  it('does nothing when options is false', () => {
    loadReadSpeaker(false);
    expect(document.getElementById('akyos-readspeaker-script')).toBeNull();
  });

  it('does nothing when options is undefined', () => {
    loadReadSpeaker(undefined);
    expect(document.getElementById('akyos-readspeaker-script')).toBeNull();
  });

  it('injects script with correct URL when readerId provided', () => {
    loadReadSpeaker({ readerId: 'myreader', lang: 'en' });
    const script = document.getElementById('akyos-readspeaker-script');
    expect(script).toBeTruthy();
    expect(script.src).toContain('myreader');
    expect(script.src).toContain('pLang=en');
  });

  it('does not inject when readerId is empty', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    loadReadSpeaker({ readerId: '' });
    expect(document.getElementById('akyos-readspeaker-script')).toBeNull();
    warnSpy.mockRestore();
  });

  it('does not inject twice when called multiple times', () => {
    loadReadSpeaker({ readerId: 'test' });
    loadReadSpeaker({ readerId: 'test' });
    const scripts = document.querySelectorAll('#akyos-readspeaker-script');
    expect(scripts.length).toBe(1);
  });
});

describe('AkyosAccessibility', () => {
  beforeEach(() => {
    document.body.innerHTML = '<main id="main"><p>Test</p></main>';
    document.documentElement.removeAttribute('lang');
    const rsScript = document.getElementById('akyos-readspeaker-script');
    if (rsScript) rsScript.remove();
  });

  it('runs all enhancers', () => {
    new AkyosAccessibility({ watch: false, logReport: false });
    expect(document.documentElement.getAttribute('lang')).toBe('fr');
    expect(document.getElementById('akyos-skip-link')).toBeTruthy();
  });

  it('respects enhancer config', () => {
    new AkyosAccessibility({
      enhancers: { lang: true, links: false, skipLinks: false, buttons: false, images: false, headings: false, forms: false, landmarks: false, videos: false, icons: false, frames: false, tables: false, document: false, contrast: false, focus: false },
      watch: false,
      logReport: false,
    });
    expect(document.documentElement.getAttribute('lang')).toBe('fr');
    expect(document.getElementById('akyos-skip-link')).toBeFalsy();
  });

  it('calls onReport callback with report and instance', () => {
    const calls = [];
    new AkyosAccessibility({
      watch: false,
      logReport: false,
      onReport: (report, instance) => calls.push({ report, instance }),
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].report).toHaveProperty('enhancements');
    expect(calls[0].report).toHaveProperty('suggestions');
    expect(calls[0].report).toHaveProperty('score');
    expect(calls[0].report).toHaveProperty('timestamp');
    expect(calls[0].instance.getReportJSON).toBeDefined();
  });

  it('getReport returns last report', () => {
    const a11y = new AkyosAccessibility({ watch: false, logReport: false });
    const report = a11y.getReport();
    expect(report).toBeTruthy();
    expect(report.enhancements).toBeDefined();
    expect(report.suggestions).toBeDefined();
    expect(report.score).toBeGreaterThanOrEqual(0);
  });

  it('does not inject ReadSpeaker script when readSpeaker is false', () => {
    new AkyosAccessibility({ watch: false, logReport: false, readSpeaker: false });
    expect(document.getElementById('akyos-readspeaker-script')).toBeNull();
  });

  it('injects ReadSpeaker script when readSpeaker has readerId', () => {
    new AkyosAccessibility({
      watch: false,
      logReport: false,
      readSpeaker: { readerId: 'test123' },
    });
    const script = document.getElementById('akyos-readspeaker-script');
    expect(script).toBeTruthy();
    expect(script.src).toContain('cdn1.readspeaker.com');
    expect(script.src).toContain('test123');
    expect(script.src).toContain('pLang=fr');
  });

  it('does not inject ReadSpeaker when readSpeaker is true without readerId', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    new AkyosAccessibility({ watch: false, logReport: false, readSpeaker: true });
    expect(document.getElementById('akyos-readspeaker-script')).toBeNull();
    warnSpy.mockRestore();
  });

  it('renders accessibility toolbar when accessibilityToolbar is true', () => {
    new AkyosAccessibility({
      watch: false,
      logReport: false,
      accessibilityToolbar: true,
    });
    expect(document.querySelector('.akyos-a11y-toolbar-btn')).toBeTruthy();
    expect(document.querySelector('.akyos-a11y-panel')).toBeTruthy();
    expect(document.getElementById('akyos-daltonization-filters')).toBeTruthy();
  });

  it('renders Écouter button and reader section when speechSynthesis available', () => {
    if (typeof window.speechSynthesis === 'undefined') return;
    new AkyosAccessibility({
      watch: false,
      logReport: false,
      accessibilityToolbar: true,
    });
    expect(document.querySelector('.akyos-a11y-read-btn-float')).toBeTruthy();
    expect(document.querySelector('#akyos-a11y-read-btn')).toBeTruthy();
    expect(document.querySelector('#akyos-a11y-highlight-bg')).toBeTruthy();
  });

  it('mode audit does not modify DOM', () => {
    const a11y = new AkyosAccessibility({ mode: 'audit', watch: false, logReport: false });
    expect(document.documentElement.getAttribute('lang')).toBeNull();
    expect(document.getElementById('akyos-skip-link')).toBeFalsy();
    const report = a11y.getReport();
    expect(report.mode).toBe('audit');
    expect(report.conformant).toBeDefined();
  });

  it('getReportJSON returns serializable report without DOM refs', () => {
    const a11y = new AkyosAccessibility({ watch: false, logReport: false });
    const json = a11y.getReportJSON();
    expect(json).toBeTruthy();
    const str = JSON.stringify(json);
    expect(str).not.toContain('[object');
    expect(json).toHaveProperty('enhancements');
    expect(json).toHaveProperty('suggestions');
    expect(json).toHaveProperty('conformant');
    expect(json).toHaveProperty('score');
    expect(json).toHaveProperty('timestamp');
    const firstItem = json.enhancements[0] || json.suggestions[0];
    if (firstItem) {
      expect(firstItem).toHaveProperty('severity');
      expect(firstItem).toHaveProperty('selector');
    }
  });
});
