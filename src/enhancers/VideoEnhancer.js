import { BaseEnhancer } from './BaseEnhancer.js';

/**
 * Améliore l'accessibilité des vidéos :
 * - Détecte les <video> sans sous-titres et signale dans le rapport
 * - Ajoute aria-label sur les lecteurs vidéo sans label
 */
export class VideoEnhancer extends BaseEnhancer {
  run() {
    const items = [];
    const videos = document.querySelectorAll('video');

    videos.forEach((video) => {
      const hasSubtitles = this.hasSubtitles(video);
      if (!hasSubtitles) {
        const src = video.querySelector('source')?.getAttribute('src') || '(sans source)';
        const short = src.split('/').pop().split('?')[0] || src;
        items.push({
          message: `Vidéo sans sous-titres : ${short}`,
          element: video,
          type: 'suggestion',
          severity: 'warning',
        });
      } else if (!this.hasCaptions(video)) {
        items.push({
          message: 'Vidéo avec sous-titres mais sans kind="captions" (RGAA 4.3.2)',
          element: video,
          type: 'suggestion',
          severity: 'info',
        });
      }

      if (!video.getAttribute('aria-label') && !video.getAttribute('aria-labelledby')) {
        const label = video.getAttribute('title') || 'Vidéo';
        video.setAttribute('aria-label', label);
        items.push({
          message: `aria-label "${label}" ajouté sur <video>`,
          element: video,
          type: 'enhancement',
          severity: 'info',
        });
      }
    });

    document.querySelectorAll('audio').forEach((audio) => {
      const hasTranscript =
        audio.nextElementSibling?.tagName === 'A' ||
        audio.previousElementSibling?.tagName === 'A' ||
        (audio.textContent || '').trim().length > 0;
      if (!hasTranscript) {
        const src = audio.querySelector('source')?.getAttribute('src') || '(sans source)';
        const short = src.split('/').pop().split('?')[0] || src;
        items.push({
          message: `Audio sans transcription : ${short}`,
          element: audio,
          type: 'suggestion',
          severity: 'warning',
        });
      }
    });

    return items;
  }

  hasSubtitles(video) {
    const tracks = video.querySelectorAll('track');
    for (const track of tracks) {
      const kind = (track.getAttribute('kind') || '').toLowerCase();
      if (kind === 'subtitles' || kind === 'captions') {
        return true;
      }
    }
    return false;
  }

  hasCaptions(video) {
    const tracks = video.querySelectorAll('track');
    for (const track of tracks) {
      const kind = (track.getAttribute('kind') || '').toLowerCase();
      if (kind === 'captions') return true;
    }
    return false;
  }
}
