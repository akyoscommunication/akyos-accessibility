import { BaseEnhancer } from './BaseEnhancer.js';

/**
 * Audit des images (alt, décoratives, area, input image, svg, canvas, object, embed).
 * RGAA 1 - Images.
 */
export class ImageEnhancer extends BaseEnhancer {
  run() {
    const items = [];

    document.querySelectorAll('img').forEach((img) => {
      if (!img.hasAttribute('alt')) {
        const src = img.getAttribute('src') || '(sans src)';
        const short = src.split('/').pop().split('?')[0] || src;
        items.push({
          message: `Image sans alt : ${short}`,
          fix: 'Ajoutez un attribut alt descriptif : <img src="..." alt="Description de l\'image">. Pour une image décorative : alt="".',
          element: img,
          type: 'suggestion',
          severity: 'error',
          rgaaRef: '1.1',
        });
      } else if (
        img.getAttribute('alt') !== '' &&
        !img.hasAttribute('aria-labelledby') &&
        !img.hasAttribute('aria-label') &&
        !img.hasAttribute('title') &&
        this.looksDecorative(img)
      ) {
        if (this.options.auditOnly) {
          items.push({
            message: 'Image décorative avec alt non vide (utiliser alt="" ou aria-hidden)',
            fix: 'Si l\'image est décorative : alt="" ou ajoutez aria-hidden="true" sur un conteneur parent.',
            element: img,
            type: 'suggestion',
            severity: 'warning',
            rgaaRef: '1.2',
          });
        } else {
          img.setAttribute('alt', '');
          items.push({
            message: 'alt="" appliqué sur image décorative',
            description: 'L\'attribut alt vide indique aux lecteurs d\'écran que l\'image est décorative et doit être ignorée.',
            element: img,
            type: 'enhancement',
            rgaaRef: '1.2',
          });
        }
      }
    });

    document.querySelectorAll('input[type="image"]').forEach((input) => {
      const alt = input.getAttribute('alt');
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledby = input.getAttribute('aria-labelledby');
      const title = input.getAttribute('title');
      if (!alt && !ariaLabel && !ariaLabelledby && !title) {
        items.push({
          message: 'Bouton image sans alternative textuelle',
          fix: 'Ajoutez alt="Description du bouton" sur <input type="image"> ou utilisez aria-label="Description".',
          element: input,
          type: 'suggestion',
          severity: 'error',
          rgaaRef: '1.1',
        });
      }
    });

    document.querySelectorAll('area[href]').forEach((area) => {
      const alt = area.getAttribute('alt');
      const ariaLabel = area.getAttribute('aria-label');
      if (!alt && !ariaLabel) {
        items.push({
          message: 'Zone réactive sans alternative textuelle',
          fix: 'Ajoutez alt="Description de la zone" sur chaque <area href="...">.',
          element: area,
          type: 'suggestion',
          severity: 'error',
          rgaaRef: '1.1',
        });
      }
    });

    document.querySelectorAll('svg[role="img"]').forEach((svg) => {
      const title = svg.querySelector('title')?.textContent?.trim();
      const ariaLabel = svg.getAttribute('aria-label');
      const ariaLabelledby = svg.getAttribute('aria-labelledby');
      if (!title && !ariaLabel && !ariaLabelledby) {
        items.push({
          message: 'SVG avec role="img" sans alternative textuelle',
          fix: 'Ajoutez <title> dans le SVG ou aria-label="Description" sur l\'élément svg.',
          element: svg,
          type: 'suggestion',
          severity: 'error',
          rgaaRef: '1.1',
        });
      }
    });

    document.querySelectorAll('canvas[role="img"]').forEach((canvas) => {
      const ariaLabel = canvas.getAttribute('aria-label');
      const ariaLabelledby = canvas.getAttribute('aria-labelledby');
      const fallback = canvas.textContent?.trim();
      if (!ariaLabel && !ariaLabelledby && !fallback) {
        items.push({
          message: 'Canvas avec role="img" sans alternative textuelle',
          fix: 'Ajoutez aria-label="Description" ou du texte alternatif visible après le canvas.',
          element: canvas,
          type: 'suggestion',
          severity: 'warning',
          rgaaRef: '1.1',
        });
      }
    });

    document.querySelectorAll('object[type^="image/"]').forEach((obj) => {
      const ariaLabel = obj.getAttribute('aria-label');
      const ariaLabelledby = obj.getAttribute('aria-labelledby');
      const title = obj.getAttribute('title');
      if (!ariaLabel && !ariaLabelledby && !title) {
        items.push({
          message: 'Object image sans alternative textuelle',
          fix: 'Ajoutez title="Description" ou aria-label="Description" sur <object>.',
          element: obj,
          type: 'suggestion',
          severity: 'warning',
          rgaaRef: '1.1',
        });
      }
    });

    document.querySelectorAll('embed[type^="image/"]').forEach((embed) => {
      const ariaLabel = embed.getAttribute('aria-label');
      const ariaLabelledby = embed.getAttribute('aria-labelledby');
      const title = embed.getAttribute('title');
      if (!ariaLabel && !ariaLabelledby && !title) {
        items.push({
          message: 'Embed image sans alternative textuelle',
          fix: 'Ajoutez title="Description" ou aria-label="Description" sur <embed>.',
          element: embed,
          type: 'suggestion',
          severity: 'warning',
          rgaaRef: '1.1',
        });
      }
    });

    return items;
  }

  looksDecorative(img) {
    const src = (img.getAttribute('src') || '').toLowerCase();
    const decorativePatterns = ['/icon', '/spacer', '/decoration', '/bullet', '/arrow', 'placeholder'];
    return decorativePatterns.some((p) => src.includes(p));
  }
}
