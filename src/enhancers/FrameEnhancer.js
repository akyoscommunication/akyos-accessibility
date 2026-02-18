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
        if (this.options.auditOnly) {
          items.push({
            message: `Cadre sans titre : ${short}`,
            fix: 'Ajoutez un attribut title descriptif : <iframe src="..." title="Description du contenu du cadre">.',
            element: frame,
            type: 'suggestion',
            severity: 'error',
            rgaaRef: '2.1',
          });
        } else {
          frame.setAttribute('title', 'Contenu embarqué');
          items.push({
            message: `title="Contenu embarqué" ajouté sur cadre : ${short}`,
            description: 'Un attribut title a été ajouté pour décrire le contenu du cadre aux lecteurs d\'écran. Vous pouvez le remplacer par une description plus précise.',
            element: frame,
            type: 'enhancement',
            rgaaRef: '2.1',
          });
        }
      }
    });

    return items;
  }
}
