import { BaseEnhancer } from './BaseEnhancer.js';

/**
 * Audit des cadres (iframe, frame) sans titre.
 * RGAA 2 - Cadres, critère 2.1, test 2.1.1.
 */
export class FrameEnhancer extends BaseEnhancer {
  run() {
    const items = [];
    const frames = document.querySelectorAll('iframe, frame');

    frames.forEach((frame) => {
      const title = frame.getAttribute('title');
      if (!title || title.trim() === '') {
        const src = frame.getAttribute('src') || '(sans src)';
        const short = src.split('/').pop().split('?')[0] || src;
        items.push({
          message: `Cadre sans titre : ${short}`,
          element: frame,
          type: 'suggestion',
          severity: 'error',
        });
      }
    });

    return items;
  }
}
