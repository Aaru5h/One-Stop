'use client';

import { useState, useEffect, useCallback, useRef, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useMovieDetails, useSeasonDetails, useUpdateProgress } from '@/hooks/useMovies';
import { useAuth } from '@/contexts/AuthContext';
import { libraryApi } from '@/lib/api';
import './watch.css';

// ─────────────────────────────────────────────────────────
// Icon Components
// ─────────────────────────────────────────────────────────
const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="icon-sm">
    <path fillRule="evenodd" d="M11.03 3.97a.75.75 0 010 1.06l-6.22 6.22H21a.75.75 0 010 1.5H4.81l6.22 6.22a.75.75 0 11-1.06 1.06l-7.5-7.5a.75.75 0 010-1.06l7.5-7.5a.75.75 0 011.06 0z" clipRule="evenodd" />
  </svg>
);



const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="icon-sm">
    <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="icon-xs">
    <path fillRule="evenodd" d="M12.53 16.28a.75.75 0 01-1.06 0l-7.5-7.5a.75.75 0 011.06-1.06L12 14.69l6.97-6.97a.75.75 0 111.06 1.06l-7.5 7.5z" clipRule="evenodd" />
  </svg>
);

const LoadingSpinner = () => (
  <div className="watch-loading">
    <div className="watch-spinner"></div>
    <p>Loading player...</p>
  </div>
);

// ─────────────────────────────────────────────────────────
// usePlayerState
//
// Three-state HUD with Cineby-style control visibility:
//   PLAYING + mouse idle 3s  → controls fade out
//   PLAYING + mouse move     → controls show (reset 3s timer)
//   PAUSED                   → controls always visible
//   PAUSED + idle 2.5s       → title card appears
// ─────────────────────────────────────────────────────────
function usePlayerState() {
  const [isPaused, setIsPaused] = useState(false);
  const [showTitleCard, setShowTitleCard] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const titleCardTimerRef = useRef(null);
  const controlsTimerRef = useRef(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    const handleMessage = (event) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data && typeof data === 'object') {
          const eventName = data.event || data.type || data.action;
          if (eventName === 'play' || eventName === 'playing') {
            setIsPaused(false);
          } else if (eventName === 'pause' || eventName === 'paused') {
            setIsPaused(true);
          } else if (eventName === 'ended') {
            setIsPaused(true);
          }
        }
      } catch {
        // Non-JSON message, ignore
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (isPaused) {
      // Paused: keep controls visible, start title card countdown
      setShowControls(true);
      clearTimeout(controlsTimerRef.current);
      clearTimeout(titleCardTimerRef.current);
      titleCardTimerRef.current = setTimeout(() => setShowTitleCard(true), 2500);
    } else {
      // Playing: hide title card, start controls fade-out timer
      setShowTitleCard(false);
      clearTimeout(titleCardTimerRef.current);
      titleCardTimerRef.current = null;
      clearTimeout(controlsTimerRef.current);
      controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
    }
    return () => {
      clearTimeout(titleCardTimerRef.current);
      clearTimeout(controlsTimerRef.current);
    };
  }, [isPaused]);

  const handleMouseActivity = useCallback(() => {
    setShowControls(true);
    if (!isPaused) {
      // While playing: reset the 3s hide timer on every mouse move
      clearTimeout(controlsTimerRef.current);
      controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
    } else {
      // While paused: mouse activity resets title card delay
      setShowTitleCard(false);
      clearTimeout(titleCardTimerRef.current);
      titleCardTimerRef.current = setTimeout(() => setShowTitleCard(true), 2500);
    }
  }, [isPaused]);

  return { isPaused, showTitleCard, showControls, handleMouseActivity, setIsPaused, iframeRef };
}

// ─────────────────────────────────────────────────────────
// Episode Sidebar Component
// ─────────────────────────────────────────────────────────
function EpisodeSidebar({
  movieId,
  seasons,
  currentSeason,
  currentEpisode,
  onSeasonChange,
  onEpisodeChange,
  onClose,
  seasonData,
  isLoadingEpisodes,
}) {
  const episodes = seasonData?.episodes || [];
  const activeEpisodeRef = useRef(null);

  useEffect(() => {
    if (activeEpisodeRef.current) {
      activeEpisodeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentEpisode, currentSeason, episodes]);

  return (
    <motion.div
      className="episode-sidebar"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
    >
      <div className="sidebar-header">
        <h2 className="sidebar-title">Episodes</h2>
        <motion.button
          className="sidebar-close-btn"
          onClick={onClose}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <CloseIcon />
        </motion.button>
      </div>

      <div className="sidebar-season-selector">
        <div className="sidebar-select-wrapper">
          <select
            value={currentSeason}
            onChange={(e) => onSeasonChange(Number(e.target.value))}
            className="sidebar-season-select"
          >
            {(seasons || []).map((s) => (
              <option key={s.seasonNumber} value={s.seasonNumber}>
                {s.name || `Season ${s.seasonNumber}`}
              </option>
            ))}
          </select>
          <ChevronDownIcon />
        </div>
      </div>

      {seasonData?.overview && (
        <p className="sidebar-season-overview">{seasonData.overview}</p>
      )}

      <div className="sidebar-episode-list">
        {isLoadingEpisodes ? (
          <div className="sidebar-loading">
            <div className="sidebar-spinner"></div>
            <p>Loading episodes...</p>
          </div>
        ) : episodes.length === 0 ? (
          <div className="sidebar-empty">
            <p>No episodes available</p>
          </div>
        ) : (
          episodes.map((ep) => {
            const isActive = ep.episodeNumber === currentEpisode;
            return (
              <motion.button
                key={ep.episodeNumber}
                ref={isActive ? activeEpisodeRef : null}
                className={`sidebar-episode-item ${isActive ? 'is-active' : ''}`}
                onClick={() => { if (!isActive) onEpisodeChange(ep.episodeNumber); }}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                whileTap={{ scale: 0.98 }}
                layout
              >
                <div className="episode-thumb-wrapper">
                  {ep.stillPath ? (
                    <img src={ep.stillPath} alt={ep.name} className="episode-thumb" loading="lazy" />
                  ) : (
                    <div className="episode-thumb-placeholder">
                      <span>{ep.episodeNumber}</span>
                    </div>
                  )}
                  {isActive && <span className="episode-watching-badge">WATCHING</span>}
                  <span className="episode-number-badge">{ep.episodeNumber}</span>
                </div>
                <div className="episode-info">
                  <h4 className="episode-title">{ep.name || `Episode ${ep.episodeNumber}`}</h4>
                  {ep.runtime && <span className="episode-runtime">{ep.runtime} min</span>}
                  {ep.overview && <p className="episode-overview">{ep.overview}</p>}
                </div>
              </motion.button>
            );
          })
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────
// Title Card Component
// ─────────────────────────────────────────────────────────
function TitleCard({ content, mediaType, season, episode, seasonData }) {
  const currentEpisode = seasonData?.episodes?.find((ep) => ep.episodeNumber === episode);

  return (
    <motion.div
      className="title-card"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="title-card-content">
        <h1 className="title-card-name">{content?.title || content?.name || ''}</h1>

        {mediaType === 'tv' && currentEpisode && (
          <div className="title-card-episode">
            <span className="title-card-episode-tag">S{season} E{episode}</span>
            <span className="title-card-episode-name">{currentEpisode.name}</span>
          </div>
        )}

        {content?.tagline && <p className="title-card-tagline">{content.tagline}</p>}

        <div className="title-card-meta">
          {content?.releaseDate && (
            <span className="title-card-year">{new Date(content.releaseDate).getFullYear()}</span>
          )}
          {content?.voteAverage > 0 && (
            <span className="title-card-rating">★ {content.voteAverage.toFixed(1)}</span>
          )}
          {content?.genres?.length > 0 && (
            <span className="title-card-genres">
              {content.genres.slice(0, 3).map((g) => g.name).join(' · ')}
            </span>
          )}
        </div>

        {currentEpisode?.overview && (
          <p className="title-card-overview">{currentEpisode.overview}</p>
        )}
        {!currentEpisode?.overview && content?.overview && (
          <p className="title-card-overview">{content.overview}</p>
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────
// Main Watch Page
// ─────────────────────────────────────────────────────────
function WatchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();

  const movieId = searchParams.get('id');
  const mediaType = searchParams.get('type') || 'movie';
  const initialSeason = Number(searchParams.get('s')) || 1;
  const initialEpisode = Number(searchParams.get('e')) || 1;

  const [season, setSeason] = useState(initialSeason);
  const [episode, setEpisode] = useState(initialEpisode);
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { isPaused, showTitleCard, showControls, handleMouseActivity, setIsPaused, iframeRef } =
    usePlayerState();

  const { data: content, isLoading: contentLoading } = useMovieDetails(movieId, mediaType);
  const { data: seasonData, isLoading: isLoadingEpisodes } = useSeasonDetails(
    mediaType === 'tv' ? movieId : null,
    mediaType === 'tv' ? season : null
  );

  // ── Progress tracking ──
  const updateProgressMutation = useUpdateProgress();
  const progressSavedRef = useRef(false);
  // Holds latest data needed for fire-and-forget on unmount
  const latestProgressPayloadRef = useRef(null);
  
  // Keep track of auth state in a ref to avoid stale closures in cleanup
  const isAuthenticatedRef = useRef(isAuthenticated);
  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  const buildProgressPayload = useCallback((overrideProgress) => {
    const currentEp = mediaType === 'tv'
      ? seasonData?.episodes?.find((ep) => ep.episodeNumber === episode)
      : null;
    return {
      title: content?.title || content?.name,
      posterPath: content?.posterPath,
      backdropPath: content?.backdropPath,
      mediaType,
      progress: overrideProgress ?? 5,
      currentTime: 0,
      duration: mediaType === 'tv'
        ? (currentEp?.runtime || 24) * 60
        : (content?.runtime || 120) * 60,
      ...(mediaType === 'tv' && {
        season,
        episode,
        episodeTitle: currentEp?.name || null,
      }),
    };
  }, [content, mediaType, season, episode, seasonData]);

  // Mark started when content is ready
  useEffect(() => {
    if (isAuthenticated && movieId && content && !progressSavedRef.current) {
      progressSavedRef.current = true;
      const payload = buildProgressPayload(5);
      latestProgressPayloadRef.current = { movieId: Number(movieId), data: payload };
      updateProgressMutation.mutate({ movieId: Number(movieId), data: payload });
    }
  }, [isAuthenticated, movieId, content, buildProgressPayload]);

  // Keep latestProgressPayloadRef fresh as episode/season changes
  useEffect(() => {
    if (isAuthenticated && movieId && content) {
      latestProgressPayloadRef.current = {
        movieId: Number(movieId),
        data: buildProgressPayload(5),
      };
    }
  }, [season, episode, isAuthenticated, movieId, content, buildProgressPayload]);

  // Mark complete when ended event fires
  useEffect(() => {
    const handleMessage = (event) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data && (data.event === 'ended' || data.type === 'ended' || data.action === 'ended')) {
          if (isAuthenticated && movieId && content) {
            updateProgressMutation.mutate({
              movieId: Number(movieId),
              data: buildProgressPayload(100),
            });
          }
        }
      } catch {}
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isAuthenticated, movieId, content, buildProgressPayload]);

  // Fire-and-forget save on page unmount
  useEffect(() => {
    return () => {
      const payload = latestProgressPayloadRef.current;
      // Use ref to avoid stale closure of isAuthenticated
      if (payload && isAuthenticatedRef.current) {
        // Use sendBeacon if available for better reliability on unmount, fallback to axios
        try {
          // Fire-and-forget API call
          libraryApi.updateProgress(payload.movieId, payload.data).catch(() => {});
        } catch (e) {}
      }
    };
  }, []); // intentionally empty — captured via ref

  const embedUrl = useMemo(() => {
    if (!movieId) return '';
    if (mediaType === 'tv') {
      return `https://www.vidking.net/embed/tv/${movieId}/${season}/${episode}?color=netflix_red&autoplay=1&episode_selector=1&next_button=1`;
    }
    return `https://www.vidking.net/embed/movie/${movieId}?color=netflix_red&autoplay=1`;
  }, [movieId, mediaType, season, episode]);

  const handleBack = useCallback(() => {
    if (window.history.length > 1) router.back();
    else router.push('/');
  }, [router]);

  const handleSeasonChange = useCallback((newSeason) => {
    setSeason(newSeason);
    setEpisode(1);
    setIsIframeLoading(true);
    setIsPaused(false);
    progressSavedRef.current = false;
    router.replace(`/watch?id=${movieId}&type=${mediaType}&s=${newSeason}&e=1`, { scroll: false });
  }, [movieId, mediaType, router, setIsPaused]);

  const handleEpisodeChange = useCallback((newEpisode) => {
    setEpisode(newEpisode);
    setIsIframeLoading(true);
    setIsPaused(false);
    setIsSidebarOpen(false);
    progressSavedRef.current = false;
    router.replace(`/watch?id=${movieId}&type=${mediaType}&s=${season}&e=${newEpisode}`, { scroll: false });
  }, [movieId, mediaType, season, router, setIsPaused]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isSidebarOpen) setIsSidebarOpen(false);
        else handleBack();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleBack, isSidebarOpen]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const handleIframeLoad = useCallback(() => setIsIframeLoading(false), []);

  useEffect(() => {
    if (!movieId) router.push('/');
  }, [movieId, router]);

  if (!movieId) return null;

  const title = content?.title || content?.name || 'Loading...';
  const realSeasons = content?.seasons || [];



  // showOverlay: drives dim + title card + gradients (paused state)
  const showOverlay = showTitleCard || isSidebarOpen;
  // showControls: drives back button + bottom bar (hover or paused)
  const showCursor = showOverlay || showControls;

  return (
    <div
      className={`watch-container ${isPaused ? 'is-paused' : 'is-playing'} ${showCursor ? 'show-overlay' : ''}`}
      onMouseMove={handleMouseActivity}
    >
      {/* ─── Video Player ─── */}
      <div className="watch-player-wrapper">
        {(contentLoading || isIframeLoading) && <LoadingSpinner />}
        <motion.div
          className="watch-player"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: isIframeLoading ? 0 : 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <iframe
            ref={iframeRef}
            key={embedUrl}
            src={embedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            className="watch-iframe"
            onLoad={handleIframeLoad}
          />
        </motion.div>
      </div>

      {/* ─── Dimmed Overlay (paused or sidebar) ─── */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            className="pause-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </AnimatePresence>

      {/* ─── Top Controls (back button) — visible when controls shown ─── */}
      <AnimatePresence>
        {(showControls || isSidebarOpen) && (
          <motion.div
            className="watch-top-controls"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <motion.button
              className="watch-back-btn"
              onClick={handleBack}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <BackIcon />
              <span>Back</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>



      {/* ─── Title Card (paused + 2.5s idle) ─── */}
      <AnimatePresence>
        {showTitleCard && content && !isSidebarOpen && (
          <TitleCard
            content={content}
            mediaType={mediaType}
            season={season}
            episode={episode}
            seasonData={seasonData}
          />
        )}
      </AnimatePresence>

      {/* ─── Episode Sidebar ─── */}
      <AnimatePresence>
        {isSidebarOpen && mediaType === 'tv' && (
          <EpisodeSidebar
            movieId={movieId}
            seasons={realSeasons}
            currentSeason={season}
            currentEpisode={episode}
            onSeasonChange={handleSeasonChange}
            onEpisodeChange={handleEpisodeChange}
            onClose={() => setIsSidebarOpen(false)}
            seasonData={seasonData}
            isLoadingEpisodes={isLoadingEpisodes}
          />
        )}
      </AnimatePresence>

      {/* ─── Gradient Overlays ─── */}
      <AnimatePresence>
        {showOverlay && (
          <>
            <motion.div
              className="watch-gradient-top"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            />
            <motion.div
              className="watch-gradient-bottom"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function WatchPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <WatchContent />
    </Suspense>
  );
}
