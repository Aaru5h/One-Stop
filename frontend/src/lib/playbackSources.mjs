// The resolver returns media URLs, never iframe URLs or arbitrary player HTML.
export function parsePlaybackRequest(params) {
  const positive = (value) => /^\d+$/.test(value || '') && Number.isSafeInteger(Number(value)) && Number(value) > 0;
  const type = params.get('type') || 'movie';
  const id = params.get('id');
  const season = params.get('s') || '1';
  const episode = params.get('e') || '1';
  if (!['movie', 'tv'].includes(type) || !positive(id) || (type === 'tv' && (!positive(season) || !positive(episode)))) return null;
  return { id, type, ...(type === 'tv' && { s: season, e: episode }) };
}

function mediaUrl(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export function normalizeSources(payload) {
  if (!Array.isArray(payload?.sources)) throw new Error('Resolver must return a sources array');
  const ids = new Set();
  return payload.sources.slice(0, 20).map((source) => {
    const url = mediaUrl(source?.url);
    if (!url || !['hls', 'mp4'].includes(source?.type) || typeof source.id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(source.id) || ids.has(source.id)) {
      throw new Error('Invalid or duplicate playback source');
    }
    ids.add(source.id);
    return {
      id: source.id,
      name: typeof source.name === 'string' ? source.name.slice(0, 80) : source.id,
      url,
      type: source.type,
      subtitles: (Array.isArray(source.subtitles) ? source.subtitles : []).slice(0, 50).flatMap((track) => {
        const src = mediaUrl(track?.url);
        if (!src || typeof track.language !== 'string' || typeof track.label !== 'string') return [];
        return [{ url: src, language: track.language.slice(0, 35), label: track.label.slice(0, 80) }];
      }),
    };
  });
}
