'use client';

import { useState, useEffect, useCallback, useRef, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useMovieDetails, useSeasonDetails } from '@/hooks/useMovies';
import './watch.css';

// ─────────────────────────────────────────────────────────
// Icon Components (Single Responsibility Principle)
// Each icon is a pure, stateless component with one job.
// ─────────────────────────────────────────────────────────
const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="icon-sm">
    <path fillRule="evenodd" d="M11.03 3.97a.75.75 0 010 1.06l-6.22 6.22H21a.75.75 0 010 1.5H4.81l6.22 6.22a.75.75 0 11-1.06 1.06l-7.5-7.5a.75.75 0 010-1.06l7.5-7.5a.75.75 0 011.06 0z" clipRule="evenodd" />
  </svg>
);

const EpisodesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="icon-sm">
    <path d="M2 4h20v2H2V4zm0 7h20v2H2v-2zm0 7h14v2H2v-2z" />
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
// Custom Hook: usePlayerState (Observer Pattern)
// 
// Listens to Vidking player's postMessage events for 
// real-time play/pause detection. No more guessing — 
// we get actual 'play', 'pause', 'ended' events.
//
// State Machine (Strategy Pattern):
//   PLAYING  → clean screen, cursor hidden
//   PAUSED   → after 2.5s idle → title card + controls
// ─────────────────────────────────────────────────────────
function usePlayerState() {
  const [isPaused, setIsPaused] = useState(false);
  const [showTitleCard, setShowTitleCard] = useState(false);
  const titleCardTimerRef = useRef(null);
  const iframeRef = useRef(null);

  // Listen for Vidking postMessage events (Observer Pattern)
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

  // When paused → start 2.5s countdown → show title card
  useEffect(() => {
    if (isPaused) {
      titleCardTimerRef.current = setTimeout(() => {
        setShowTitleCard(true);
      }, 2500);
    } else {
      setShowTitleCard(false);
      if (titleCardTimerRef.current) {
        clearTimeout(titleCardTimerRef.current);
        titleCardTimerRef.current = null;
      }
    }

    return () => {
      if (titleCardTimerRef.current) {
        clearTimeout(titleCardTimerRef.current);
      }
    };
  }, [isPaused]);

  // Reset 2.5s timer on mouse activity while paused
  const handleMouseActivity = useCallback(() => {
    if (!isPaused) return;

    setShowTitleCard(false);
    if (titleCardTimerRef.current) {
      clearTimeout(titleCardTimerRef.current);
    }
    titleCardTimerRef.current = setTimeout(() => {
      setShowTitleCard(true);
    }, 2500);
  }, [isPaused]);

  return { isPaused, showTitleCard, handleMouseActivity, setIsPaused, iframeRef };
}

// ─────────────────────────────────────────────────────────
// Episode Sidebar Component (Cineby-Inspired)
//
// Slides in from the right, showing:
//   - Season dropdown at the top
//   - Scrollable episode list with thumbnails
//   - "WATCHING" badge on the active episode
//   - Click to switch episodes instantly
//
// Follows Interface Segregation: accepts only the 
// minimal props it needs.
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

  // Auto-scroll to the currently watching episode
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
      {/* Sidebar Header */}
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

      {/* Season Selector */}
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

      {/* Season Overview */}
      {seasonData?.overview && (
        <p className="sidebar-season-overview">{seasonData.overview}</p>
      )}

      {/* Episode List */}
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
                onClick={() => {
                  if (!isActive) {
                    onEpisodeChange(ep.episodeNumber);
                  }
                }}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                whileTap={{ scale: 0.98 }}
                layout
              >
                {/* Episode Thumbnail */}
                <div className="episode-thumb-wrapper">
                  {ep.stillPath ? (
                    <img
                      src={ep.stillPath}
                      alt={ep.name}
                      className="episode-thumb"
                      loading="lazy"
                    />
                  ) : (
                    <div className="episode-thumb-placeholder">
                      <span>{ep.episodeNumber}</span>
                    </div>
                  )}
                  {isActive && (
                    <span className="episode-watching-badge">WATCHING</span>
                  )}
                  <span className="episode-number-badge">{ep.episodeNumber}</span>
                </div>

                {/* Episode Info */}
                <div className="episode-info">
                  <h4 className="episode-title">
                    {ep.name || `Episode ${ep.episodeNumber}`}
                  </h4>
                  {ep.runtime && (
                    <span className="episode-runtime">{ep.runtime} min</span>
                  )}
                  {ep.overview && (
                    <p className="episode-overview">{ep.overview}</p>
                  )}
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
// Netflix-Style Title Card Component
// Shown only in State 3 (paused + 2.5s idle).
// Includes an "Episodes" button for TV shows.
// ─────────────────────────────────────────────────────────
function TitleCard({ content, mediaType, season, episode, seasonData, onOpenEpisodes }) {
  const currentEpisode = seasonData?.episodes?.find(
    (ep) => ep.episodeNumber === episode
  );

  return (
    <motion.div
      className="title-card"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="title-card-content">
        <h1 className="title-card-name">
          {content?.title || content?.name || ''}
        </h1>

        {mediaType === 'tv' && currentEpisode && (
          <div className="title-card-episode">
            <span className="title-card-episode-tag">
              S{season} E{episode}
            </span>
            <span className="title-card-episode-name">
              {currentEpisode.name}
            </span>
          </div>
        )}

        {content?.tagline && (
          <p className="title-card-tagline">{content.tagline}</p>
        )}

        <div className="title-card-meta">
          {content?.releaseDate && (
            <span className="title-card-year">
              {new Date(content.releaseDate).getFullYear()}
            </span>
          )}
          {content?.voteAverage > 0 && (
            <span className="title-card-rating">
              ★ {content.voteAverage.toFixed(1)}
            </span>
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

        {/* Action buttons */}
        {mediaType === 'tv' && (
          <div className="title-card-actions">
            {/* Moved Episodes button to floating position per user request */}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────
// Main Watch Page Component (Facade Pattern)
//
// Orchestrates all sub-components and manages global state.
// Encapsulates complex interactions between:
//   - Vidking iframe player
//   - postMessage event stream
//   - Episode sidebar panel
//   - Title card overlay
//   - Keyboard/mouse interaction
//
// Dependency Inversion: UI depends on abstractions
// (hooks/api) not concrete TMDB implementation.
// ─────────────────────────────────────────────────────────
function WatchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const movieId = searchParams.get('id');
  const mediaType = searchParams.get('type') || 'movie';
  const initialSeason = Number(searchParams.get('s')) || 1;
  const initialEpisode = Number(searchParams.get('e')) || 1;

  // State
  const [season, setSeason] = useState(initialSeason);
  const [episode, setEpisode] = useState(initialEpisode);
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Player state (3-state HUD + Vidking postMessage tracking)
  const { isPaused, showTitleCard, handleMouseActivity, setIsPaused, iframeRef } =
    usePlayerState();

  // Data fetching (Dependency Inversion — abstractions, not implementations)
  const { data: content, isLoading: contentLoading } = useMovieDetails(movieId, mediaType);
  const { data: seasonData, isLoading: isLoadingEpisodes } = useSeasonDetails(
    mediaType === 'tv' ? movieId : null,
    mediaType === 'tv' ? season : null
  );

  // Vidking embed URL (replaces 2embed.cc)
  const embedUrl = useMemo(() => {
    if (!movieId) return '';
    if (mediaType === 'tv') {
      return `https://www.vidking.net/embed/tv/${movieId}/${season}/${episode}?color=netflix_red&autoplay=1&episode_selector=0&next_button=0`;
    }
    return `https://www.vidking.net/embed/movie/${movieId}?color=netflix_red&autoplay=1`;
  }, [movieId, mediaType, season, episode]);

  // ── Navigation ──
  const handleBack = useCallback(() => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  }, [router]);

  // ── Episode/Season Handlers ──
  const handleSeasonChange = useCallback(
    (newSeason) => {
      setSeason(newSeason);
      setEpisode(1);
      setIsIframeLoading(true);
      setIsPaused(false);
      router.replace(
        `/watch?id=${movieId}&type=${mediaType}&s=${newSeason}&e=1`,
        { scroll: false }
      );
    },
    [movieId, mediaType, router, setIsPaused]
  );

  const handleEpisodeChange = useCallback(
    (newEpisode) => {
      setEpisode(newEpisode);
      setIsIframeLoading(true);
      setIsPaused(false);
      setIsSidebarOpen(false); // Close sidebar on episode change
      router.replace(
        `/watch?id=${movieId}&type=${mediaType}&s=${season}&e=${newEpisode}`,
        { scroll: false }
      );
    },
    [movieId, mediaType, season, router, setIsPaused]
  );

  // ── Keyboard Navigation ──
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isSidebarOpen) {
          setIsSidebarOpen(false);
        } else {
          handleBack();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleBack, isSidebarOpen]);

  // ── Prevent body scroll ──
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // ── Iframe load handler ──
  const handleIframeLoad = useCallback(() => {
    setIsIframeLoading(false);
  }, []);

  // ── Redirect if no movie ID ──
  useEffect(() => {
    if (!movieId) {
      router.push('/');
    }
  }, [movieId, router]);

  if (!movieId) return null;

  const title = content?.title || content?.name || 'Loading...';
  const realSeasons = content?.seasons || [];

  // Determine HUD visibility states
  const showOverlay = showTitleCard || isSidebarOpen;

  return (
    <div
      className={`watch-container ${isPaused ? 'is-paused' : 'is-playing'} ${showOverlay ? 'show-overlay' : ''}`}
      onMouseMove={handleMouseActivity}
    >
      {/* ─── Video Player (Always visible) ─── */}
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

      {/* ─── Dimmed Overlay (Paused state or sidebar open) ─── */}
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

      {/* ─── Top Controls (Visible when title card or sidebar) ─── */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            className="watch-top-controls"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
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

      {/* ─── Floating Episodes Button (Always Accessible) ─── */}
      <AnimatePresence>
        {mediaType === 'tv' && realSeasons.length > 0 && !isSidebarOpen && (
          <motion.button
            className="watch-floating-episodes-btn"
            onClick={() => setIsSidebarOpen(true)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <EpisodesIcon />
            <span>Episodes</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ─── Netflix Title Card (Paused + 2.5s idle, not when sidebar open) ─── */}
      <AnimatePresence>
        {showTitleCard && content && !isSidebarOpen && (
          <TitleCard
            content={content}
            mediaType={mediaType}
            season={season}
            episode={episode}
            seasonData={seasonData}
            onOpenEpisodes={() => setIsSidebarOpen(true)}
          />
        )}
      </AnimatePresence>

      {/* ─── Episode Sidebar (Cineby-style slide-in panel) ─── */}
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

      {/* ─── Gradient overlays (readability) ─── */}
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
