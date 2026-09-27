// src/lib/fingerprint.ts

/**
 * Generates a stable, lightweight browser & device fingerprint
 * that remains consistent across page reloads and private/incognito tabs
 * on the same machine.
 */
export function getBrowserFingerprint(): string {
  if (typeof window === 'undefined') return 'server';

  try {
    const screenInfo = `${window.screen?.width || 0}x${window.screen?.height || 0}x${window.screen?.colorDepth || 0}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const language = navigator.language || '';
    const hardware = `${navigator.hardwareConcurrency || 2}`;
    const platform = (navigator as any).userAgentData?.platform || navigator.platform || '';

    // Canvas fingerprint: draws a small distinct text/shape to hash GPU/font rendering
    let canvasHash = '';
    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 30;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#f60';
      ctx.fillRect(5, 5, 50, 20);
      ctx.fillStyle = '#069';
      ctx.font = '14px Arial';
      ctx.fillText('mohan-fastfolio', 2, 18);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('mohan-fastfolio', 4, 20);
      canvasHash = canvas.toDataURL();
    }

    const raw = `${screenInfo}|${timezone}|${language}|${hardware}|${platform}|${canvasHash}`;

    // Fast DJB2 hash
    let hash = 5381;
    for (let i = 0; i < raw.length; i++) {
      hash = ((hash << 5) + hash) + raw.charCodeAt(i);
      hash |= 0;
    }

    return `fp_${Math.abs(hash).toString(36)}`;
  } catch {
    return 'fp_client';
  }
}
