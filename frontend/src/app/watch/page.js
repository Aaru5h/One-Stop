'use client';

import { useState, useEffect, useCallback, useRef, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useMovieDetails, useSeasonDetails, useProgress } from '@/hooks/useMovies';
import { useAuth } from '@/contexts/AuthContext';
import { libraryApi, movieApi } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
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

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="icon-sm">
    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
  </svg>
);

const SkipNextIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="icon-sm">
    <path d="M5.055 7.06c-1.25-.714-2.805.189-2.805 1.628v8.623c0 1.44 1.554 2.342 2.805 1.628L12 14.471v2.84c0 1.44 1.554 2.342 2.805 1.628l7.108-4.061c1.26-.72 1.26-2.536 0-3.256L14.805 7.56C13.554 6.847 12 7.75 12 9.188v2.84L5.055 7.06z" />
  </svg>
);

const EpisodesListIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="icon-sm">
    <path fillRule="evenodd" d="M2.625 6.75a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875 0A.75.75 0 018.25 6h12a.75.75 0 010 1.5h-12a.75.75 0 01-.75-.75zM2.625 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875 0a.75.75 0 01.75-.75h12a.75.75 0 010 1.5h-12a.75.75 0 01-.75-.75zm-4.875 5.25a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875 0a.75.75 0 01.75-.75h12a.75.75 0 010 1.5h-12a.75.75 0 01-.75-.75z" clipRule="evenodd" />
  </svg>
);

const AutoplayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="icon-sm">
    <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
  </svg>
);

const LoadingSpinner = () => (
  <div className="watch-loading">
    <div className="watch-spinner"></div>
    <p>Loading player...</p>
  </div>
);

// Helper to parse message events from Vidking iframe player
function parsePlayerMessage(event) {
  try {
    const parsed = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    if (!parsed || typeof parsed !== 'object') return null;

    // Check if nested PLAYER_EVENT format
    if (parsed.type === 'PLAYER_EVENT' && parsed.data && typeof parsed.data === 'object') {
      return {
        eventName: parsed.data.event || parsed.data.type || parsed.data.action,
        currentTime: parsed.data.currentTime,
        duration: parsed.data.duration,
        progress: parsed.data.progress,
        data: parsed.data
      };
    }

    // Flat format
    return {
      eventName: parsed.event || parsed.type || parsed.action,
      currentTime: parsed.currentTime,
      duration: parsed.duration,
      progress: parsed.progress,
      data: parsed
    };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────
// usePlayerState
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
      const parsed = parsePlayerMessage(event);
      if (!parsed) return;

      const { eventName } = parsed;
      if (eventName === 'play' || eventName === 'playing') {
        setIsPaused(false);
      } else if (eventName === 'pause' || eventName === 'paused') {
        setIsPaused(true);
      } else if (eventName === 'ended') {
        setIsPaused(true);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (isPaused) {
      setShowControls(true);
      clearTimeout(controlsTimerRef.current);
      clearTimeout(titleCardTimerRef.current);
      titleCardTimerRef.current = setTimeout(() => setShowTitleCard(true), 2500);
    } else {
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
      clearTimeout(controlsTimerRef.current);
      controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
    } else {
      setShowTitleCard(false);
      clearTimeout(titleCardTimerRef.current);
      titleCardTimerRef.current = setTimeout(() => setShowTitleCard(true), 2500);
    }
  }, [isPaused]);

  return { isPaused, showTitleCard, showControls, handleMouseActivity, setIsPaused, iframeRef };
}

// ─────────────────────────────────────────────────────────
// Autoplay Next Episode Overlay Card
// ─────────────────────────────────────────────────────────
function AutoplayNextCard({
  nextEpisodeInfo,
  countdown,
  totalDuration = 8,
  onPlayNow,
  onCancel,
  isAutoplayEnabled,
  onToggleAutoplay,
  contentFallbackBackdrop
}) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = Math.max(0, Math.min(1, countdown / totalDuration));
  const strokeDashoffset = circumference - progressRatio * circumference;

  const thumbnail = nextEpisodeInfo?.stillPath || contentFallbackBackdrop;

  return (
    <motion.div
      className="autoplay-next-card"
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 30, scale: 0.95 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="autoplay-card-header">
        <div className="autoplay-timer-indicator">
          <svg className="autoplay-timer-svg" width="44" height="44" viewBox="0 0 44 44">
            <circle
              className="autoplay-timer-bg"
              cx="22"
              cy="22"
              r={radius}
            />
            <circle
              className="autoplay-timer-bar"
              cx="22"
              cy="22"
              r={radius}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
          <span className="autoplay-countdown-number">{countdown}</span>
        </div>
        <div className="autoplay-header-text">
          <span className="autoplay-header-title">Up Next</span>
          <span className="autoplay-header-subtitle">Playing in {countdown}s</span>
        </div>
        <motion.button
          className="autoplay-close-btn"
          onClick={onCancel}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="Cancel autoplay"
        >
          <CloseIcon />
        </motion.button>
      </div>

      <div className="autoplay-card-body">
        <div className="autoplay-thumb-container" onClick={onPlayNow}>
          {thumbnail ? (
            <img src={thumbnail} alt={nextEpisodeInfo.title || 'Next Episode'} className="autoplay-thumb-img" />
          ) : (
            <div className="autoplay-thumb-placeholder">
              <span>{nextEpisodeInfo.episode}</span>
            </div>
          )}
          <div className="autoplay-thumb-play-overlay">
            <PlayIcon />
          </div>
          <span className="autoplay-thumb-tag">
            S{nextEpisodeInfo.season} E{nextEpisodeInfo.episode}
          </span>
        </div>

        <div className="autoplay-info">
          <h4 className="autoplay-ep-title" title={nextEpisodeInfo.title}>
            {nextEpisodeInfo.title || `Episode ${nextEpisodeInfo.episode}`}
          </h4>
          {nextEpisodeInfo.runtime && (
            <span className="autoplay-ep-runtime">{nextEpisodeInfo.runtime} min</span>
          )}
          {nextEpisodeInfo.overview && (
            <p className="autoplay-ep-overview">{nextEpisodeInfo.overview}</p>
          )}
        </div>
      </div>

      <div className="autoplay-card-actions">
        <motion.button
          className="autoplay-play-now-btn"
          onClick={onPlayNow}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <PlayIcon />
          <span>Play Now</span>
        </motion.button>
        <motion.button
          className="autoplay-cancel-btn"
          onClick={onCancel}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Cancel
        </motion.button>
      </div>

      <div className="autoplay-toggle-wrapper">
        <label className="autoplay-toggle-label">
          <input
            type="checkbox"
            checked={isAutoplayEnabled}
            onChange={onToggleAutoplay}
            className="autoplay-checkbox"
          />
          <span className="autoplay-toggle-slider"></span>
          <span className="autoplay-toggle-text">Autoplay next episode</span>
        </label>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────
// Episode Sidebar Component
// ─────────────────────────────────────────────────────────
function EpisodeSidebar({
  seasons,
  currentSeason,
  currentEpisode,
  onSeasonChange,
  onEpisodeChange,
  onClose,
  seasonData,
  isLoadingEpisodes,
  isAutoplayEnabled,
  onToggleAutoplay,
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

      <div className="sidebar-autoplay-bar">
        <label className="autoplay-toggle-label">
          <input
            type="checkbox"
            checked={isAutoplayEnabled}
            onChange={onToggleAutoplay}
            className="autoplay-checkbox"
          />
          <span className="autoplay-toggle-slider"></span>
          <span className="autoplay-toggle-text">Autoplay next episode</span>
        </label>
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
function TitleCard({ content, mediaType, season, episode, seasonData, onOpenEpisodes, nextEpisodeInfo, onPlayNext }) {
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

        {mediaType === 'tv' && (
          <div className="title-card-actions">
            <motion.button
              className="title-card-episodes-btn"
              onClick={onOpenEpisodes}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              <EpisodesListIcon />
              <span>All Episodes</span>
            </motion.button>
            {nextEpisodeInfo && (
              <motion.button
                className="title-card-next-btn"
                onClick={onPlayNext}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                <SkipNextIcon />
                <span>Next: S{nextEpisodeInfo.season} E{nextEpisodeInfo.episode}</span>
              </motion.button>
            )}
          </div>
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
  const queryClient = useQueryClient();

  const movieId = searchParams.get('id');
  const mediaType = searchParams.get('type') || 'movie';
  const urlSeason = searchParams.get('s') ? Number(searchParams.get('s')) : null;
  const urlEpisode = searchParams.get('e') ? Number(searchParams.get('e')) : null;

  const [season, setSeason] = useState(urlSeason || 1);
  const [episode, setEpisode] = useState(urlEpisode || 1);
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Resume states
  const [isInitialized, setIsInitialized] = useState(false);
  const [startTime, setStartTime] = useState(0);

  // Autoplay states
  const [isAutoplayEnabled, setIsAutoplayEnabled] = useState(true);
  const [showAutoplayPrompt, setShowAutoplayPrompt] = useState(false);
  const [autoplayCountdown, setAutoplayCountdown] = useState(8);
  const [isAutoplayDismissed, setIsAutoplayDismissed] = useState(false);
  const autoplayCountdownIntervalRef = useRef(null);

  // Load autoplay preference from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('onestop_autoplay_next');
      if (stored !== null) {
        setIsAutoplayEnabled(stored === 'true');
      }
    } catch {}
  }, []);

  const toggleAutoplay = useCallback(() => {
    setIsAutoplayEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('onestop_autoplay_next', String(next));
      } catch {}
      return next;
    });
  }, []);

  const { isPaused, showTitleCard, showControls, handleMouseActivity, setIsPaused, iframeRef } =
    usePlayerState();

  const { data: content, isLoading: contentLoading } = useMovieDetails(movieId, mediaType);
  const { data: seasonData, isLoading: isLoadingEpisodes } = useSeasonDetails(
    mediaType === 'tv' ? movieId : null,
    mediaType === 'tv' ? season : null
  );

  // Fetch watch progress from backend
  const { data: progressQueryData, isLoading: progressQueryLoading } = useProgress(
    isAuthenticated ? movieId : null
  );

  // Filter valid seasons list
  const realSeasons = useMemo(() => {
    return (content?.seasons || []).filter((s) => s.seasonNumber > 0).sort((a, b) => a.seasonNumber - b.seasonNumber);
  }, [content?.seasons]);

  // Compute Next Episode Details
  const nextEpisodeInfo = useMemo(() => {
    if (mediaType !== 'tv') return null;
    const currentEpisodes = seasonData?.episodes || [];

    // 1. Next episode in same season
    const currentEpIndex = currentEpisodes.findIndex((ep) => ep.episodeNumber === episode);
    if (currentEpIndex !== -1 && currentEpIndex < currentEpisodes.length - 1) {
      const nextEp = currentEpisodes[currentEpIndex + 1];
      return {
        season,
        episode: nextEp.episodeNumber,
        title: nextEp.name,
        overview: nextEp.overview,
        stillPath: nextEp.stillPath,
        runtime: nextEp.runtime,
        isNextSeason: false,
      };
    }

    // 2. Next season episode 1
    const hasMoreInSeason = currentEpisodes.length > 0 && episode < currentEpisodes[currentEpisodes.length - 1].episodeNumber;
    if (!hasMoreInSeason) {
      const nextSeasonObj = realSeasons.find((s) => s.seasonNumber > season);
      if (nextSeasonObj) {
        return {
          season: nextSeasonObj.seasonNumber,
          episode: 1,
          title: `Season ${nextSeasonObj.seasonNumber} Premiere`,
          overview: nextSeasonObj.overview || `Season ${nextSeasonObj.seasonNumber}, Episode 1`,
          stillPath: null,
          runtime: null,
          isNextSeason: true,
        };
      }
    }

    return null;
  }, [mediaType, season, episode, seasonData, realSeasons]);

  // Prefetch next season data if transitioning across seasons
  useEffect(() => {
    if (nextEpisodeInfo?.isNextSeason && movieId) {
      queryClient.prefetchQuery({
        queryKey: ['tv', movieId, 'season', nextEpisodeInfo.season],
        queryFn: () => movieApi.getSeasonDetails(movieId, nextEpisodeInfo.season).then((res) => res.data),
        staleTime: 30 * 60 * 1000,
      });
    }
  }, [nextEpisodeInfo, movieId, queryClient]);

  // Navigation handlers
  const handleBack = useCallback(() => {
    if (window.history.length > 1) router.back();
    else router.push('/');
  }, [router]);

  const handleSeasonChange = useCallback((newSeason) => {
    setShowAutoplayPrompt(false);
    setIsAutoplayDismissed(false);
    if (autoplayCountdownIntervalRef.current) {
      clearInterval(autoplayCountdownIntervalRef.current);
      autoplayCountdownIntervalRef.current = null;
    }
    setSeason(newSeason);
    setEpisode(1);
    setStartTime(0);
    setIsIframeLoading(true);
    setIsPaused(false);
    lastSavedTimeRef.current = 0;
    router.replace(`/watch?id=${movieId}&type=${mediaType}&s=${newSeason}&e=1`, { scroll: false });
  }, [movieId, mediaType, router, setIsPaused]);

  const handleEpisodeChange = useCallback((newEpisode, targetSeason) => {
    setShowAutoplayPrompt(false);
    setIsAutoplayDismissed(false);
    if (autoplayCountdownIntervalRef.current) {
      clearInterval(autoplayCountdownIntervalRef.current);
      autoplayCountdownIntervalRef.current = null;
    }
    const s = targetSeason || season;
    if (targetSeason && targetSeason !== season) {
      setSeason(targetSeason);
    }
    setEpisode(newEpisode);
    setStartTime(0);
    setIsIframeLoading(true);
    setIsPaused(false);
    setIsSidebarOpen(false);
    lastSavedTimeRef.current = 0;
    router.replace(`/watch?id=${movieId}&type=${mediaType}&s=${s}&e=${newEpisode}`, { scroll: false });
  }, [movieId, mediaType, season, router, setIsPaused]);

  const playNextEpisodeImmediately = useCallback(() => {
    if (!nextEpisodeInfo) return;
    if (autoplayCountdownIntervalRef.current) {
      clearInterval(autoplayCountdownIntervalRef.current);
      autoplayCountdownIntervalRef.current = null;
    }
    setShowAutoplayPrompt(false);
    setIsAutoplayDismissed(false);
    handleEpisodeChange(nextEpisodeInfo.episode, nextEpisodeInfo.season);
  }, [nextEpisodeInfo, handleEpisodeChange]);

  const cancelAutoplay = useCallback(() => {
    setShowAutoplayPrompt(false);
    setIsAutoplayDismissed(true);
    if (autoplayCountdownIntervalRef.current) {
      clearInterval(autoplayCountdownIntervalRef.current);
      autoplayCountdownIntervalRef.current = null;
    }
  }, []);

  const startAutoplayCountdown = useCallback(() => {
    if (!isAutoplayEnabled || !nextEpisodeInfo || isAutoplayDismissed || showAutoplayPrompt) return;
    setAutoplayCountdown(8);
    setShowAutoplayPrompt(true);
  }, [isAutoplayEnabled, nextEpisodeInfo, isAutoplayDismissed, showAutoplayPrompt]);

  // Autoplay countdown timer tick
  useEffect(() => {
    if (showAutoplayPrompt) {
      autoplayCountdownIntervalRef.current = setInterval(() => {
        setAutoplayCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(autoplayCountdownIntervalRef.current);
            autoplayCountdownIntervalRef.current = null;
            playNextEpisodeImmediately();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (autoplayCountdownIntervalRef.current) {
        clearInterval(autoplayCountdownIntervalRef.current);
        autoplayCountdownIntervalRef.current = null;
      }
    }
    return () => {
      if (autoplayCountdownIntervalRef.current) {
        clearInterval(autoplayCountdownIntervalRef.current);
      }
    };
  }, [showAutoplayPrompt, playNextEpisodeImmediately]);

  // Refs for tracking playback variables without triggering React re-renders or closures
  const contentRef = useRef(content);
  const seasonRef = useRef(season);
  const episodeRef = useRef(episode);
  const seasonDataRef = useRef(seasonData);
  const isAuthenticatedRef = useRef(isAuthenticated);
  const isAutoplayEnabledRef = useRef(isAutoplayEnabled);
  const nextEpisodeInfoRef = useRef(nextEpisodeInfo);
  const isAutoplayDismissedRef = useRef(isAutoplayDismissed);
  const showAutoplayPromptRef = useRef(showAutoplayPrompt);
  const currentPlaybackStateRef = useRef({ currentTime: 0, duration: 0, progress: 0 });
  const lastSavedTimeRef = useRef(0);

  useEffect(() => { contentRef.current = content; }, [content]);
  useEffect(() => { seasonRef.current = season; }, [season]);
  useEffect(() => { episodeRef.current = episode; }, [episode]);
  useEffect(() => { seasonDataRef.current = seasonData; }, [seasonData]);
  useEffect(() => { isAuthenticatedRef.current = isAuthenticated; }, [isAuthenticated]);
  useEffect(() => { isAutoplayEnabledRef.current = isAutoplayEnabled; }, [isAutoplayEnabled]);
  useEffect(() => { nextEpisodeInfoRef.current = nextEpisodeInfo; }, [nextEpisodeInfo]);
  useEffect(() => { isAutoplayDismissedRef.current = isAutoplayDismissed; }, [isAutoplayDismissed]);
  useEffect(() => { showAutoplayPromptRef.current = showAutoplayPrompt; }, [showAutoplayPrompt]);

  // Initializing Starting Episode and Start Time
  useEffect(() => {
    if (contentLoading || (isAuthenticated && progressQueryLoading)) return;
    if (isInitialized) return;

    let startS = urlSeason || 1;
    let startE = urlEpisode || 1;
    let startT = 0;

    const saved = progressQueryData?.progress;
    if (saved && saved.movieId === Number(movieId)) {
      if (mediaType === 'tv') {
        if (urlSeason !== null && urlEpisode !== null) {
          if (urlSeason === saved.season && urlEpisode === saved.episode) {
            startT = saved.currentTime || 0;
            if (saved.progress >= 95) startT = 0;
          }
        } else {
          startS = saved.season || 1;
          startE = saved.episode || 1;
          startT = saved.currentTime || 0;
          if (saved.progress >= 95) startT = 0;
          router.replace(`/watch?id=${movieId}&type=tv&s=${startS}&e=${startE}`, { scroll: false });
        }
      } else {
        startT = saved.currentTime || 0;
        if (saved.progress >= 95) startT = 0;
      }
    }

    setSeason(startS);
    setEpisode(startE);
    setStartTime(Math.floor(startT));
    setIsInitialized(true);
  }, [
    contentLoading,
    progressQueryLoading,
    isAuthenticated,
    progressQueryData,
    movieId,
    mediaType,
    urlSeason,
    urlEpisode,
    isInitialized,
    router
  ]);

  // Save progress helper
  const saveProgress = useCallback((playbackState) => {
    if (!isAuthenticatedRef.current || !movieId || !contentRef.current) return;

    const progress = playbackState?.progress || 0;
    const currentTime = playbackState?.currentTime || 0;
    const duration = playbackState?.duration || 0;

    const currentEp = mediaType === 'tv'
      ? seasonDataRef.current?.episodes?.find((ep) => ep.episodeNumber === episodeRef.current)
      : null;

    const payload = {
      title: contentRef.current?.title || contentRef.current?.name,
      posterPath: contentRef.current?.posterPath,
      backdropPath: contentRef.current?.backdropPath,
      mediaType,
      progress: Math.min(100, Math.max(0, progress)),
      currentTime: Math.floor(currentTime),
      duration: Math.floor(duration),
      ...(mediaType === 'tv' && {
        season: seasonRef.current,
        episode: episodeRef.current,
        episodeTitle: currentEp?.name || null,
      }),
    };

    libraryApi.updateProgress(Number(movieId), payload)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['library', 'continueWatching'] });
      })
      .catch((err) => console.error('Failed to save progress:', err));
  }, [movieId, mediaType, queryClient]);

  // Iframe player event listener
  useEffect(() => {
    const handleMessage = (event) => {
      const parsed = parsePlayerMessage(event);
      if (!parsed) return;

      const { eventName, data: eventData } = parsed;

      if (eventName === 'timeupdate') {
        const currentTime = Number(eventData.currentTime || 0);
        const duration = Number(eventData.duration || 0);
        const progress = Number(eventData.progress || 0);

        // Check if player reported a different season/episode (e.g. internal autoplay)
        const reportedSeason = eventData.season ? Number(eventData.season) : null;
        const reportedEpisode = eventData.episode ? Number(eventData.episode) : null;

        if (mediaType === 'tv' && reportedSeason && reportedEpisode &&
            (reportedSeason !== seasonRef.current || reportedEpisode !== episodeRef.current)) {
          setShowAutoplayPrompt(false);
          setIsAutoplayDismissed(false);
          setSeason(reportedSeason);
          setEpisode(reportedEpisode);
          setStartTime(0);
          lastSavedTimeRef.current = 0;
          currentPlaybackStateRef.current = { currentTime: 0, duration: 0, progress: 0 };
          router.replace(`/watch?id=${movieId}&type=tv&s=${reportedSeason}&e=${reportedEpisode}`, { scroll: false });
          return;
        }

        currentPlaybackStateRef.current = { currentTime, duration, progress };

        // Save progress periodically (every 15 seconds)
        if (Math.abs(currentTime - lastSavedTimeRef.current) >= 15) {
          lastSavedTimeRef.current = currentTime;
          saveProgress({ currentTime, duration, progress });
        }

        // Trigger autoplay countdown near end (credits: <= 25 seconds remaining or >= 96% progress)
        if (
          mediaType === 'tv' &&
          duration > 60 &&
          (duration - currentTime <= 25 || progress >= 96)
        ) {
          if (
            isAutoplayEnabledRef.current &&
            nextEpisodeInfoRef.current &&
            !isAutoplayDismissedRef.current &&
            !showAutoplayPromptRef.current
          ) {
            startAutoplayCountdown();
          }
        }
      } else if (eventName === 'pause' || eventName === 'paused') {
        saveProgress(currentPlaybackStateRef.current);
      } else if (eventName === 'ended') {
        saveProgress({
          ...currentPlaybackStateRef.current,
          progress: 100
        });
        if (
          mediaType === 'tv' &&
          isAutoplayEnabledRef.current &&
          nextEpisodeInfoRef.current &&
          !isAutoplayDismissedRef.current
        ) {
          startAutoplayCountdown();
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [movieId, mediaType, router, saveProgress, startAutoplayCountdown]);

  // Unmount effect (keepalive send)
  useEffect(() => {
    return () => {
      const playbackState = currentPlaybackStateRef.current;
      if (isAuthenticatedRef.current && movieId && (playbackState.currentTime > 0 || playbackState.progress > 0)) {
        const currentEp = mediaType === 'tv'
          ? seasonDataRef.current?.episodes?.find((ep) => ep.episodeNumber === episodeRef.current)
          : null;

        const payload = {
          title: contentRef.current?.title || contentRef.current?.name,
          posterPath: contentRef.current?.posterPath,
          backdropPath: contentRef.current?.backdropPath,
          mediaType,
          progress: Math.min(100, Math.max(0, playbackState.progress)),
          currentTime: Math.floor(playbackState.currentTime),
          duration: Math.floor(playbackState.duration),
          ...(mediaType === 'tv' && {
            season: seasonRef.current,
            episode: episodeRef.current,
            episodeTitle: currentEp?.name || null,
          }),
        };

        const token = localStorage.getItem('token');
        const url = `/api/library/progress/${movieId}`;

        try {
          fetch(url, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify(payload),
            keepalive: true
          }).catch(() => {});
        } catch (e) {
          console.error('Error during keepalive progress save:', e);
        }
      }
    };
  }, [movieId, mediaType]);

  const embedUrl = useMemo(() => {
    if (!isInitialized || !movieId) return '';
    const startParam = startTime > 0 ? `&start=${startTime}` : '';
    if (mediaType === 'tv') {
      return `https://www.vidking.net/embed/tv/${movieId}/${season}/${episode}?color=e50914&nextEpisode=true&episodeSelector=true&autoplay=1${startParam}`;
    }
    return `https://www.vidking.net/embed/movie/${movieId}?color=e50914&autoplay=1${startParam}`;
  }, [movieId, mediaType, season, episode, startTime, isInitialized]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showAutoplayPrompt) cancelAutoplay();
        else if (isSidebarOpen) setIsSidebarOpen(false);
        else handleBack();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleBack, isSidebarOpen, showAutoplayPrompt, cancelAutoplay]);

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
  const showOverlay = showTitleCard || isSidebarOpen;
  const showCursor = showOverlay || showControls || showAutoplayPrompt;
  const isPageLoading = !isInitialized || contentLoading || (isAuthenticated && progressQueryLoading) || isIframeLoading;

  return (
    <div
      className={`watch-container ${isPaused ? 'is-paused' : 'is-playing'} ${showCursor ? 'show-overlay' : ''}`}
      onMouseMove={handleMouseActivity}
    >
      {/* ─── Video Player ─── */}
      <div className="watch-player-wrapper">
        {isPageLoading && <LoadingSpinner />}
        <motion.div
          className="watch-player"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: isIframeLoading ? 0 : 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {isInitialized && (
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
          )}
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

      {/* ─── Top Controls Bar — visible when controls shown ─── */}
      <AnimatePresence>
        {(showControls || isSidebarOpen) && (
          <motion.div
            className="watch-top-controls"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div className="watch-top-left">
              <motion.button
                className="watch-back-btn"
                onClick={handleBack}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <BackIcon />
                <span>Back</span>
              </motion.button>
              <div className="watch-top-title-info">
                <span className="watch-top-title">{title}</span>
                {mediaType === 'tv' && (
                  <span className="watch-top-badge">S{season} E{episode}</span>
                )}
              </div>
            </div>

            <div className="watch-top-actions">
              {mediaType === 'tv' && (
                <>
                  <motion.button
                    className={`watch-top-btn watch-autoplay-toggle-btn ${isAutoplayEnabled ? 'is-active' : ''}`}
                    onClick={toggleAutoplay}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title={isAutoplayEnabled ? 'Autoplay Next: Enabled' : 'Autoplay Next: Disabled'}
                  >
                    <AutoplayIcon />
                    <span>Autoplay: {isAutoplayEnabled ? 'ON' : 'OFF'}</span>
                  </motion.button>

                  {nextEpisodeInfo && (
                    <motion.button
                      className="watch-top-btn"
                      onClick={playNextEpisodeImmediately}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title={`Next Episode (S${nextEpisodeInfo.season} E${nextEpisodeInfo.episode})`}
                    >
                      <SkipNextIcon />
                      <span>Next Ep</span>
                    </motion.button>
                  )}

                  <motion.button
                    className="watch-top-btn"
                    onClick={() => setIsSidebarOpen((prev) => !prev)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Episodes List"
                  >
                    <EpisodesListIcon />
                    <span>Episodes</span>
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Netflix-Style Autoplay Next Episode Countdown Overlay ─── */}
      <AnimatePresence>
        {showAutoplayPrompt && nextEpisodeInfo && (
          <AutoplayNextCard
            nextEpisodeInfo={nextEpisodeInfo}
            countdown={autoplayCountdown}
            totalDuration={8}
            onPlayNow={playNextEpisodeImmediately}
            onCancel={cancelAutoplay}
            isAutoplayEnabled={isAutoplayEnabled}
            onToggleAutoplay={toggleAutoplay}
            contentFallbackBackdrop={content?.backdropPath || content?.posterPath}
          />
        )}
      </AnimatePresence>

      {/* ─── Title Card (paused + 2.5s idle) ─── */}
      <AnimatePresence>
        {showTitleCard && content && !isSidebarOpen && !showAutoplayPrompt && (
          <TitleCard
            content={content}
            mediaType={mediaType}
            season={season}
            episode={episode}
            seasonData={seasonData}
            onOpenEpisodes={() => setIsSidebarOpen(true)}
            nextEpisodeInfo={nextEpisodeInfo}
            onPlayNext={playNextEpisodeImmediately}
          />
        )}
      </AnimatePresence>

      {/* ─── Episode Sidebar ─── */}
      <AnimatePresence>
        {isSidebarOpen && mediaType === 'tv' && (
          <EpisodeSidebar
            seasons={realSeasons}
            currentSeason={season}
            currentEpisode={episode}
            onSeasonChange={handleSeasonChange}
            onEpisodeChange={handleEpisodeChange}
            onClose={() => setIsSidebarOpen(false)}
            seasonData={seasonData}
            isLoadingEpisodes={isLoadingEpisodes}
            isAutoplayEnabled={isAutoplayEnabled}
            onToggleAutoplay={toggleAutoplay}
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
