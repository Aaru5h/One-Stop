const paths = {
  back: 'M19 12H5m6-6-6 6 6 6',
  close: 'm6 6 12 12M6 18 18 6',
  play: 'm8 5 11 7-11 7Z',
  pause: 'M8 5v14M16 5v14',
  next: 'm5 5 10 7-10 7ZM19 5v14',
  episodes: 'M5 8h14v12H5zM7 4h10M9 1h6',
  servers: 'M6 18a4 4 0 0 1-1-7.87A7 7 0 0 1 18.5 9a4.5 4.5 0 0 1 0 9Z',
  subtitles: 'M3 5h18v14H3zM6 10h4m4 0h4M6 14h2m3 0h3m3 0h1',
  settings: 'm10 3-.5 3-2 1-3-.5-2 3 2.5 2v2L2.5 16l2 3 3-.5 2 1 .5 2h4l.5-2 2-1 3 .5 2-3-2.5-2.5v-2L22 9l-2-3-3 .5-2-1-.5-2Zm5 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  fullscreen: 'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',
  pip: 'M3 4h18v16H3zM12 11h7v7h-7z',
  volume: 'M11 4 6 8H3v8h3l5 4ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',
  muted: 'M11 4 6 8H3v8h3l5 4Zm5 5 6 6m-6 0 6-6',
  left: 'm15 6-6 6 6 6',
  right: 'm9 6 6 6-6 6',
  down: 'm6 9 6 6 6-6',
  check: 'm5 12 4 4L19 6',
  rewind: 'M4 9a8 8 0 1 1 0 7M4 3v6h6',
  forward: 'M20 9a8 8 0 1 0 0 7m0-13v6h-6',
};

export default function PlayerIcon({ name }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={paths[name]} />
    {(name === 'rewind' || name === 'forward') && <text x="12" y="15" textAnchor="middle" stroke="none" fill="currentColor" fontSize="8" fontWeight="700">10</text>}
  </svg>;
}
