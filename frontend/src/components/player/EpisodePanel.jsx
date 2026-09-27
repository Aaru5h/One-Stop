'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useSeasonDetails } from '@/hooks/useMovies';
import Icon from './PlayerIcon';

// Browsing seasons never changes playback. Both player engines use this panel.
export default function EpisodePanel({ movieId, seasons, currentSeason, currentEpisode, onEpisodeChange, onClose }) {
  const [browseSeason, setBrowseSeason] = useState(currentSeason);
  const [showSeasons, setShowSeasons] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const { data, isPending, isError, refetch } = useSeasonDetails(movieId, browseSeason);
  const railRef = useRef(null);
  const panelRef = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const previousFocus = document.activeElement;
    panelRef.current?.querySelector('button')?.focus({ preventScroll: true });
    return () => { if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true }); };
  }, []);

  useEffect(() => {
    panelRef.current?.querySelector('button')?.focus({ preventScroll: true });
  }, [showSeasons, browseSeason]);

  useEffect(() => {
    if (showSeasons) return;
    const rail = railRef.current;
    if (!rail) return;
    const active = rail.querySelector('[aria-current="true"]');
    rail.scrollTo({ left: active ? Math.max(0, active.offsetLeft - rail.clientWidth / 2 + active.clientWidth / 2) : 0 });
    const update = () => setEdges({ start: rail.scrollLeft < 2, end: rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 2 });
    update();
    rail.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(rail);
    return () => { rail.removeEventListener('scroll', update); observer.disconnect(); };
  }, [data, browseSeason, currentSeason, currentEpisode, showSeasons]);

  const page = (direction) => railRef.current?.scrollBy({ left: direction * railRef.current.clientWidth * 0.8, behavior: reducedMotion ? 'instant' : 'smooth' });
  const seasonOptions = seasons?.length ? seasons : [{ seasonNumber: currentSeason, name: `Season ${currentSeason}` }];

  return <motion.section ref={panelRef} className={`episode-strip${showSeasons ? ' is-season-picker' : ''}`} role="dialog" aria-label="Episodes and seasons"
    initial={{ opacity: 0, y: reducedMotion ? 0 : 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
    <div className="strip-top">
      {showSeasons ? <><button className="watch-icon-btn" aria-label="Back to episodes" onClick={() => setShowSeasons(false)}><Icon name="back" /></button><h2 className="strip-panel-title">Seasons</h2></>
        : <button className="strip-season-button" aria-label="Change season" onClick={() => setShowSeasons(true)}>Season {browseSeason}<Icon name="down" /></button>}
      <button className="watch-menu-close strip-close" onClick={onClose} aria-label="Close episodes"><Icon name="close" /></button>
    </div>
    {showSeasons ? <div className="strip-seasons">
      {seasonOptions.map((s) => <button key={s.seasonNumber} className={`strip-season-option${s.seasonNumber === browseSeason ? ' is-selected' : ''}`} aria-pressed={s.seasonNumber === browseSeason}
        onClick={() => { setBrowseSeason(s.seasonNumber); setExpanded(null); setShowSeasons(false); }}>
        <span className="strip-season-number">S{s.seasonNumber}</span><span>{s.name || `Season ${s.seasonNumber}`}</span>
        {s.seasonNumber === currentSeason && <span className="strip-season-playing">Playing</span>}
      </button>)}
    </div> : <div className="strip-body">
      <button className="strip-nav is-prev" disabled={edges.start || isPending || isError} onClick={() => page(-1)} aria-label="Previous episodes"><Icon name="left" /></button>
      <div className="strip-rail" ref={railRef} aria-busy={isPending}>
        {isPending ? <div className="strip-empty" role="status"><div className="watch-spinner is-small" /><span>Loading episodes</span></div>
          : isError ? <div className="strip-empty" role="alert"><p>Couldn’t load this season.</p><button className="watch-btn" onClick={() => refetch()}>Try again</button></div>
          : !data?.episodes?.length ? <div className="strip-empty"><p>No episodes available in this season.</p></div>
          : data.episodes.map((ep) => {
            const active = browseSeason === currentSeason && ep.episodeNumber === currentEpisode;
            const isExpanded = expanded === ep.episodeNumber;
            return <article key={ep.episodeNumber} className={`strip-card${active ? ' is-active' : ''}`} aria-current={active ? 'true' : undefined}>
              <button className="strip-episode-button" disabled={active} aria-label={`${active ? 'Now playing' : 'Play'} S${browseSeason} E${ep.episodeNumber}: ${ep.name || `Episode ${ep.episodeNumber}`}`}
                onClick={() => onEpisodeChange(ep.episodeNumber, browseSeason)}>
                <div className="strip-thumb">
                  {ep.stillPath ? <img src={ep.stillPath} alt="" loading="lazy" /> : <span className="strip-thumb-fallback">{ep.episodeNumber}</span>}
                  <span className="strip-tag">S{browseSeason}E{ep.episodeNumber}{active ? ' · Now Playing' : ''}</span>
                  {!active && <span className="strip-play"><Icon name="play" /></span>}
                </div>
                <h3 className="strip-title">{ep.name || `Episode ${ep.episodeNumber}`}</h3>
              </button>
              <div className="strip-info">
                {ep.overview && <><p id={`episode-overview-${ep.episodeNumber}`} className={`strip-overview${isExpanded ? ' is-expanded' : ''}`}>{ep.overview}</p>
                  <button className="strip-more" aria-expanded={isExpanded} aria-controls={`episode-overview-${ep.episodeNumber}`} onClick={() => setExpanded(isExpanded ? null : ep.episodeNumber)}>{isExpanded ? 'Show less' : 'Show more'}</button></>}
                {ep.runtime > 0 && <span className="strip-runtime">{ep.runtime} min</span>}
              </div>
            </article>;
          })}
      </div>
      <button className="strip-nav is-next" disabled={edges.end || isPending || isError} onClick={() => page(1)} aria-label="More episodes"><Icon name="right" /></button>
    </div>}
  </motion.section>;
}
