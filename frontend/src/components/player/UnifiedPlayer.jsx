'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { AnimatePresence } from 'framer-motion';
import EpisodePanel from './EpisodePanel';
import Icon from './PlayerIcon';

export function formatTime(seconds) {
  const n = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  return n >= 3600 ? `${Math.floor(n / 3600)}:${String(Math.floor(n / 60) % 60).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`
    : `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
}

function IconButton({ icon, label, ...props }) {
  return <button className="watch-icon-btn" aria-label={label} title={label} {...props}><Icon name={icon} /></button>;
}

export default function UnifiedPlayer(props) {
  const [selection, setSelection] = useState(() => {
    let preferred;
    try { preferred = localStorage.getItem('onestop_direct_server'); } catch {}
    return { index: Math.max(0, props.sources.findIndex((s) => s.id === preferred)), start: props.startTime || 0, revision: 0 };
  });
  const failed = useRef(new Set());
  const [preferences, setPreferences] = useState({ volume: 1, muted: false, rate: 1, paused: false });
  const source = props.sources[selection.index];
  const select = (index, time, prefs, manual = true) => {
    if (manual) {
      failed.current.clear();
      try { localStorage.setItem('onestop_direct_server', props.sources[index].id); } catch {}
    }
    setPreferences(prefs);
    setSelection((previous) => ({ index, start: time, revision: previous.revision + 1 }));
  };
  const failover = (time, prefs) => {
    failed.current.add(source.id);
    const next = props.sources.findIndex((s) => !failed.current.has(s.id));
    if (next === -1) return false;
    select(next, time, prefs, false);
    return true;
  };
  return <PlaybackSession key={`${source.id}:${selection.revision}`} {...props} source={source} startTime={selection.start}
    preferences={preferences} onSelect={select} onFailover={failover} />;
}

function PlaybackSession({ sources, source, title, subtitle, overview, poster, movieId, seasons, season, episode,
  nextEpisode, onEpisodeChange, onBack, onProgress, startTime, preferences, onSelect, onFailover,
  autoplayNext, onToggleAutoplay, fullscreenRoot }) {
  const rootRef = useRef(null);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const readyRef = useRef(false);
  const fatalRef = useRef(false);
  const hideTimer = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [paused, setPaused] = useState(true);
  const [buffering, setBuffering] = useState(true);
  const [time, setTime] = useState(startTime);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(preferences.volume);
  const [muted, setMuted] = useState(preferences.muted);
  const [rate, setRate] = useState(preferences.rate);
  const [menu, setMenu] = useState(null);
  const [chromeVisible, setChromeVisible] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [levels, setLevels] = useState([]);
  const [quality, setQuality] = useState(-1);
  const [tracks, setTracks] = useState([]);
  const [caption, setCaption] = useState(-1);
  const [fit, setFit] = useState('contain');
  const [pipSupported, setPipSupported] = useState(false);
  const [countdown, setCountdown] = useState(null);

  const currentPreferences = () => ({ volume: videoRef.current?.volume ?? volume, muted: videoRef.current?.muted ?? muted, rate: videoRef.current?.playbackRate ?? rate, paused: videoRef.current?.paused ?? paused });
  const latestRef = useRef(null);
  useEffect(() => { latestRef.current = { onProgress, onFailover }; }, [onProgress, onFailover]);

  useEffect(() => {
    const video = videoRef.current;
    video.volume = preferences.volume;
    video.muted = preferences.muted;
    video.playbackRate = preferences.rate;
    const fail = () => {
      if (fatalRef.current) return;
      fatalRef.current = true;
      const position = readyRef.current ? video.currentTime : startTime;
      const moved = latestRef.current.onFailover(position, { volume: video.volume, muted: video.muted, rate: video.playbackRate, paused: readyRef.current ? video.paused : preferences.paused });
      if (!moved) { setError('None of the servers could play this video.'); setBuffering(false); }
    };
    video.addEventListener('error', fail);
    let hls;
    const report = () => {
      if (!readyRef.current || !Number.isFinite(video.duration) || !video.duration) return;
      latestRef.current.onProgress({ currentTime: video.currentTime, duration: video.duration,
        progress: 100 * video.currentTime / video.duration }, video.paused || video.ended);
    };
    video.addEventListener('timeupdate', report);
    video.addEventListener('pause', report);
    video.addEventListener('ended', report);
    window.addEventListener('pagehide', report);
    if (source.type === 'hls' && Hls.isSupported()) {
      hls = new Hls({ maxBufferLength: 30, capLevelToPlayerSize: true });
      hlsRef.current = hls;
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLevels(hls.levels.map((level, index) => ({ index, label: level.height ? `${level.height}p` : `${Math.round(level.bitrate / 1000)} kbps` })));
        if (!preferences.paused) video.play().catch(() => { setPaused(true); setBuffering(false); });
        else setBuffering(false);
      });
      hls.on(Hls.Events.ERROR, (_, data) => { if (data.fatal) fail(); });
      hls.loadSource(source.url);
      hls.attachMedia(video);
    } else if (source.type === 'mp4' || video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source.url;
      video.load();
    } else {
      // Run through the same failure path as an unsupported media error.
      video.dispatchEvent(new Event('error'));
    }
    const timeout = setTimeout(() => { if (!readyRef.current) fail(); }, 20000);
    const updateTracks = () => setTracks(Array.from(video.textTracks).map((track, index) => ({ index, label: track.label || track.language || `Track ${index + 1}` })));
    video.textTracks.addEventListener('addtrack', updateTracks);
    video.textTracks.addEventListener('removetrack', updateTracks);
    return () => {
      report();
      clearTimeout(timeout);
      clearTimeout(hideTimer.current);
      window.removeEventListener('pagehide', report);
      video.removeEventListener('timeupdate', report);
      video.removeEventListener('pause', report);
      video.removeEventListener('ended', report);
      video.textTracks.removeEventListener('addtrack', updateTracks);
      video.textTracks.removeEventListener('removetrack', updateTracks);
      video.removeEventListener('error', fail);
      hls?.destroy();
      video.removeAttribute('src');
      video.load();
    };
  }, [source, preferences, startTime]);

  const showControls = () => {
    setChromeVisible(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      const focusedControl = rootRef.current?.contains(document.activeElement) && document.activeElement?.closest('button, input, select');
      if (!videoRef.current?.paused && !focusedControl) setChromeVisible(false);
    }, 3000);
  };

  useEffect(() => {
    if (!menu) return;
    if (menu !== 'episodes') menuRef.current?.querySelector('button')?.focus({ preventScroll: true });
    const outside = (event) => {
      if (!event.target.closest('.native-menu, .episode-strip, [data-player-menu]')) setMenu(null);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [menu]);

  useEffect(() => {
    if (countdown === null) return;
    const timer = setTimeout(() => {
      if (countdown <= 1) { onEpisodeChange(nextEpisode.episode, nextEpisode.season); }
      else setCountdown(countdown - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, nextEpisode, onEpisodeChange]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (video.paused) video.play().catch(() => setNotice('Playback could not start. Try another server.'));
    else video.pause();
    showControls();
  };
  const seek = (value) => {
    const video = videoRef.current;
    if (!Number.isFinite(video.duration)) return;
    video.currentTime = Math.min(video.duration, Math.max(0, value));
    setTime(video.currentTime);
    setCountdown(null);
    showControls();
  };
  const fullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (fullscreenRoot.current.requestFullscreen) await fullscreenRoot.current.requestFullscreen();
      else if (videoRef.current.webkitEnterFullscreen) videoRef.current.webkitEnterFullscreen();
      else setNotice('Fullscreen is not available in this browser.');
    } catch { setNotice('Couldn’t enter fullscreen.'); }
  };
  const toggleMenu = (name, event) => {
    triggerRef.current = event.currentTarget;
    setMenu((current) => current === name ? null : name);
    showControls();
  };
  const closeMenu = () => { setMenu(null); triggerRef.current?.focus({ preventScroll: true }); };
  const keyDown = (event) => {
    if (event.key === 'Escape') {
      if (menu) { event.preventDefault(); closeMenu(); }
      else if (countdown !== null) setCountdown(null);
      return;
    }
    if (event.target.closest('input, select, button, [contenteditable]')) return;
    if (event.key === ' ' || event.key.toLowerCase() === 'k') { event.preventDefault(); togglePlay(); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); seek(videoRef.current.currentTime - 10); }
    else if (event.key === 'ArrowRight') { event.preventDefault(); seek(videoRef.current.currentTime + 10); }
    else if (event.key.toLowerCase() === 'f') fullscreen();
    else if (event.key.toLowerCase() === 'm') videoRef.current.muted = !videoRef.current.muted;
  };
  const visible = chromeVisible || paused || menu || error || buffering || countdown !== null;

  return <div ref={rootRef} className={`watch-container native-player${visible ? '' : ' is-idle'}`} tabIndex={0} aria-label={`${title} video player`}
    onKeyDown={keyDown} onPointerMove={showControls} onFocusCapture={showControls}>
    <video ref={videoRef} className="native-video" style={{ objectFit: fit }} crossOrigin="anonymous" playsInline preload="metadata" poster={poster || undefined}
      onClick={togglePlay} onDoubleClick={fullscreen}
      onLoadedMetadata={() => {
        const video = videoRef.current;
        if (Number.isFinite(video.duration)) {
          setDuration(video.duration);
          video.currentTime = Math.min(startTime, Math.max(0, video.duration - 1));
        }
        readyRef.current = true;
        setPipSupported(Boolean(document.pictureInPictureEnabled && video.requestPictureInPicture));
        setTracks(Array.from(video.textTracks).map((t, index) => ({ index, label: t.label || t.language || `Track ${index + 1}` })));
        if (!preferences.paused) video.play().catch(() => { setPaused(true); setBuffering(false); });
        else setBuffering(false);
      }}
      onTimeUpdate={() => setTime(videoRef.current.currentTime)}
      onPlaying={() => { setPaused(false); setBuffering(false); showControls(); }}
      onPause={() => { setPaused(true); setChromeVisible(true); }}
      onWaiting={() => setBuffering(true)} onCanPlay={() => setBuffering(false)}
      onVolumeChange={() => { setVolume(videoRef.current.volume); setMuted(videoRef.current.muted); }}
      onEnded={() => { setPaused(true); if (autoplayNext && nextEpisode) setCountdown(8); }}>
      {source.subtitles?.map((track) => <track key={track.url} kind="subtitles" src={track.url} srcLang={track.language} label={track.label} />)}
    </video>
    {(paused || menu) && <div className="native-shade" aria-hidden="true" />}

    <header className="native-header native-chrome">
      <IconButton icon="back" label="Back" onClick={onBack} />
      <div className="watch-heading"><h1 className="watch-heading-title">{title}</h1>{subtitle && <p className="watch-heading-sub">{subtitle}</p>}</div>
      <span className="native-header-spacer" />
    </header>

    {buffering && !error && <div className="native-loading" role="status"><div className="watch-spinner" /><span>Loading {source.name}</span></div>}
    {paused && !buffering && !menu && !error && countdown === null && <div className="native-paused-copy"><h2>{title}</h2>{subtitle && <p className="native-paused-subtitle">{subtitle}</p>}{overview && <p>{overview}</p>}</div>}
    {error && <div className="native-error" role="alert"><h2>Video unavailable</h2><p>{error}</p><button className="watch-btn is-primary" onClick={() => onSelect(sources.indexOf(source), time, currentPreferences())}>Try again</button></div>}
    {notice && <div className="native-notice" role="status">{notice}<button aria-label="Dismiss message" onClick={() => setNotice('')}><Icon name="close" /></button></div>}

    <AnimatePresence>{menu === 'episodes' && <EpisodePanel movieId={movieId} seasons={seasons} currentSeason={season} currentEpisode={episode} onEpisodeChange={onEpisodeChange} onClose={closeMenu} />}</AnimatePresence>

    {menu && menu !== 'episodes' && <section ref={menuRef} className="native-menu watch-menu" role="dialog" aria-label={menu === 'servers' ? 'Servers' : menu === 'subtitles' ? 'Subtitles' : 'Settings'}>
      <div className="watch-menu-top"><h2 className="watch-menu-title">{menu === 'servers' ? 'Servers' : menu === 'subtitles' ? 'Subtitles' : 'Settings'}</h2><IconButton icon="close" label="Close menu" onClick={closeMenu} /></div>
      {menu === 'servers' && <div className="watch-menu-list">{sources.map((s, index) => <button key={s.id} className={`watch-menu-item${s.id === source.id ? ' is-playing' : ''}`} aria-current={s.id === source.id ? 'true' : undefined}
        onClick={() => { if (s.id === source.id) closeMenu(); else onSelect(index, readyRef.current ? videoRef.current.currentTime : startTime, currentPreferences()); }}><span className="watch-menu-item-label">{s.name}</span>{s.id === source.id && <span className="watch-menu-check"><Icon name="check" /></span>}</button>)}</div>}
      {menu === 'subtitles' && <div className="watch-menu-list">{[{ index: -1, label: 'Off' }, ...tracks].map((track) => <button key={track.index} className="watch-menu-item" aria-pressed={caption === track.index} onClick={() => {
        Array.from(videoRef.current.textTracks).forEach((t, i) => { t.mode = i === track.index ? 'showing' : 'disabled'; });
        setCaption(track.index);
      }}><span className="watch-menu-item-label">{track.label}</span>{caption === track.index && <Icon name="check" />}</button>)}{!tracks.length && <p className="watch-menu-hint">No subtitles on this server.</p>}</div>}
      {menu === 'settings' && <div className="native-settings">
        <label>Playback speed<select value={rate} onChange={(e) => { videoRef.current.playbackRate = Number(e.target.value); setRate(Number(e.target.value)); }}>{[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((n) => <option key={n} value={n}>{n === 1 ? 'Normal' : `${n}×`}</option>)}</select></label>
        {levels.length > 0 && <label>Quality<select value={quality} onChange={(e) => { const level = Number(e.target.value); hlsRef.current.currentLevel = level; setQuality(level); }}><option value={-1}>Auto</option>{levels.map((l) => <option key={l.index} value={l.index}>{l.label}</option>)}</select></label>}
        <label>Picture<select value={fit} onChange={(e) => setFit(e.target.value)}><option value="contain">Original</option><option value="cover">Zoom</option><option value="fill">Stretch</option></select></label>
        {season && <label className="autoplay-toggle-label"><span>Autoplay next episode</span><input type="checkbox" checked={autoplayNext} onChange={() => { setCountdown(null); onToggleAutoplay(); }} /></label>}
      </div>}
    </section>}

    {countdown !== null && nextEpisode && <section className="native-up-next" aria-label="Up next"><p>Next episode in {countdown}s</p><h2>{nextEpisode.title || `S${nextEpisode.season} E${nextEpisode.episode}`}</h2><div><button className="watch-btn is-primary" onClick={() => onEpisodeChange(nextEpisode.episode, nextEpisode.season)}>Play now</button><button className="watch-btn" onClick={() => setCountdown(null)}>Cancel</button></div></section>}

    <footer className="native-controls native-chrome">
      <input className="native-seek" type="range" aria-label="Seek video" aria-valuetext={`${formatTime(time)} of ${formatTime(duration)}`} min="0" max={duration || 1} step="0.1" value={Math.min(time, duration || 1)} disabled={!duration || Boolean(error)}
        style={{ '--played': `${duration ? time / duration * 100 : 0}%` }} onChange={(e) => seek(Number(e.target.value))} />
      <div className="native-control-row">
        <div className="native-controls-left">
          <IconButton icon={paused ? 'play' : 'pause'} label={paused ? 'Play' : 'Pause'} disabled={Boolean(error)} onClick={togglePlay} />
          <IconButton icon="rewind" label="Rewind 10 seconds" onClick={() => seek(time - 10)} disabled={!duration} />
          <IconButton icon="forward" label="Forward 10 seconds" onClick={() => seek(time + 10)} disabled={!duration} />
          <div className="native-volume"><IconButton icon={muted || !volume ? 'muted' : 'volume'} label={muted ? 'Unmute' : 'Mute'} onClick={() => { videoRef.current.muted = !muted; }} /><input type="range" aria-label="Volume" min="0" max="1" step="0.05" value={muted ? 0 : volume} onChange={(e) => { videoRef.current.volume = Number(e.target.value); videoRef.current.muted = false; }} /></div>
          <span className="native-time">{formatTime(time)} <span>/ {formatTime(duration)}</span></span>
        </div>
        <div className="native-controls-right">
          {nextEpisode && <IconButton icon="next" label={`Next episode: S${nextEpisode.season} E${nextEpisode.episode}`} onClick={() => onEpisodeChange(nextEpisode.episode, nextEpisode.season)} />}
          {season && <IconButton icon="episodes" label="Episodes" data-player-menu aria-expanded={menu === 'episodes'} onClick={(e) => toggleMenu('episodes', e)} />}
          {pipSupported && <IconButton icon="pip" label="Picture in picture" onClick={async () => { try { if (document.pictureInPictureElement) await document.exitPictureInPicture(); else await videoRef.current.requestPictureInPicture(); } catch { setNotice('Picture in picture is unavailable.'); } }} />}
          <IconButton icon="servers" label="Servers" data-player-menu aria-expanded={menu === 'servers'} onClick={(e) => toggleMenu('servers', e)} />
          <IconButton icon="subtitles" label="Subtitles" data-player-menu aria-expanded={menu === 'subtitles'} onClick={(e) => toggleMenu('subtitles', e)} />
          <IconButton icon="settings" label="Settings" data-player-menu aria-expanded={menu === 'settings'} onClick={(e) => toggleMenu('settings', e)} />
          <IconButton icon="fullscreen" label="Fullscreen" onClick={fullscreen} />
        </div>
      </div>
    </footer>
  </div>;
}
