import { BaseEnhancer } from './BaseEnhancer.js';

/**
 * Audit des images sans attribut alt.
 * Ne modifie pas le DOM : signale uniquement dans le rapport pour correction manuelle.
 */
export class ImageEnhancer extends BaseEnhancer {
  run() {
    const images = document.querySelectorAll('img:not([alt])');
    if (images.length === 0) return [];

    const items = [];
    images.forEach((img) => {
      const src = img.getAttribute('src') || '(sans src)';
      const short = src.split('/').pop().split('?')[0] || src;
      items.push({
        message: `Image sans alt : ${short}`,
        element: img,
        type: 'suggestion',
        severity: 'error',
      });
    });
    return items;
  }
}
