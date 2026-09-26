// Order = default priority. The user's manually picked provider is moved to the front.
export const STREAM_PROVIDERS = [
  {
    id: 'vidking',
    name: 'Vidking',
    origin: 'https://www.vidking.net/',
    getUrl: (type, id, s, e, startTime) => {
      const startParam = startTime > 0 ? `&start=${startTime}` : '';
      return type === 'tv'
        ? `https://www.vidking.net/embed/tv/${id}/${s}/${e}?color=e50914&nextEpisode=true&episodeSelector=true&autoplay=1${startParam}`
        : `https://www.vidking.net/embed/movie/${id}?color=e50914&autoplay=1${startParam}`;
    },
  },
  {
    // The player 2Embed wraps, embedded directly: same stream, minus 2Embed's server-menu and share overlays.
    id: 'vidsrc',
    name: 'VidSrc',
    origin: 'https://vidsrc.buzz/',
    getUrl: (type, id, s, e) =>
      type === 'tv'
        ? `https://vidsrc.buzz/embed/tv/${id}/${s}/${e}`
        : `https://vidsrc.buzz/embed/movie/${id}`,
  },
  {
    id: 'superembed',
    name: 'SuperEmbed',
    origin: 'https://multiembed.mov/',
    getUrl: (type, id, s, e) =>
      type === 'tv'
        ? `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`
        : `https://multiembed.mov/?video_id=${id}&tmdb=1`,
  },
  {
    id: '2embed',
    name: '2Embed',
    origin: 'https://www.2embed.cc/',
    getUrl: (type, id, s, e) =>
      type === 'tv'
        ? `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`
        : `https://www.2embed.cc/embed/${id}`,
  },
  {
    id: 'autoembed',
    name: 'AutoEmbed',
    origin: 'https://player.autoembed.cc/',
    getUrl: (type, id, s, e) =>
      type === 'tv'
        ? `https://player.autoembed.cc/embed/tv/${id}/${s}/${e}`
        : `https://player.autoembed.cc/embed/movie/${id}`,
  },
];

const PROBE_TIMEOUT_MS = 5000;
const PROBE_TTL_MS = 5 * 60 * 1000;
const DOWN_TTL_MS = 15 * 60 * 1000;
const DOWN_KEY = 'onestop_provider_down';
const probeCache = new Map();
let resetGeneration = 0;

function readDown() {
  try { return JSON.parse(localStorage.getItem(DOWN_KEY)) || {}; } catch { return {}; }
}

function writeDown(down) {
  try { localStorage.setItem(DOWN_KEY, JSON.stringify(down)); } catch {}
}

// Runs in the viewer's browser on purpose: ISP DNS blocks only show up from the viewer's network.
// A Cloudflare bot-check page also fails the probe (it sends CORP same-origin), which is correct:
// that page sends X-Frame-Options SAMEORIGIN, so it can't render in our iframe either.
// ponytail: reachability only. A cross-origin iframe can't tell us "no video for this title", so that case relies on the manual "next source" button.
export function probeProvider(provider) {
  const hit = probeCache.get(provider.id);
  if (hit && Date.now() - hit.at < PROBE_TTL_MS) return hit.promise;
  // Known-dead providers are skipped instantly on later visits instead of re-waiting the timeout.
  if (Date.now() - (readDown()[provider.id] || 0) < DOWN_TTL_MS) return Promise.resolve(false);
  const promise = fetch(provider.origin, {
    mode: 'no-cors',
    cache: 'no-store',
    signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
  }).then(() => true, () => false).then((up) => {
    if (!up) markProviderDown(provider.id);
    return up;
  });
  probeCache.set(provider.id, { at: Date.now(), promise });
  return promise;
}

export function markProviderDown(id) {
  probeCache.set(id, { at: Date.now(), promise: Promise.resolve(false) });
  // Reloading or leaving cancels in-flight probes with the same "Failed to fetch" a dead site gives,
  // and before pagehide fires. Only persist if the page is still alive a moment later.
  const at = Date.now();
  const gen = resetGeneration;
  setTimeout(() => {
    if (gen === resetGeneration) writeDown({ ...readDown(), [id]: at });
  }, 1000);
}

export function getDownProviderIds() {
  const down = readDown();
  return STREAM_PROVIDERS.map((p) => p.id).filter((id) => Date.now() - (down[id] || 0) < DOWN_TTL_MS);
}

export function resetProviderProbes() {
  resetGeneration++;
  probeCache.clear();
  try { localStorage.removeItem(DOWN_KEY); } catch {}
}

export function orderProviders(preferredId) {
  const preferred = STREAM_PROVIDERS.find((p) => p.id === preferredId);
  return preferred ? [preferred, ...STREAM_PROVIDERS.filter((p) => p !== preferred)] : STREAM_PROVIDERS;
}

// All probes start at once; the first reachable provider in priority order wins.
export async function pickProvider(candidates) {
  const results = candidates.map(probeProvider);
  for (let i = 0; i < candidates.length; i++) {
    if (await results[i]) return candidates[i];
  }
  return null;
}
