'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useMovieDetails, useSeasonDetails } from '@/hooks/useMovies';
import './watch.css';

// ─────────────────────────────────────────────────────────
// Icon Components (Single Responsibility Principle)
// ─────────────────────────────────────────────────────────
const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path fillRule="evenodd" d="M11.03 3.97a.75.75 0 010 1.06l-6.22 6.22H21a.75.75 0 010 1.5H4.81l6.22 6.22a.75.75 0 11-1.06 1.06l-7.5-7.5a.75.75 0 010-1.06l7.5-7.5a.75.75 0 011.06 0z" clipRule="evenodd" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M12.53 16.28a.75.75 0 01-1.06 0l-7.5-7.5a.75.75 0 011.06-1.06L12 14.69l6.97-6.97a.75.75 0 111.06 1.06l-7.5 7.5z" clipRule="evenodd" />
  </svg>
);

const ShareIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M15.75 4.5a3 3 0 11.825 2.066l-8.421 4.679a3.002 3.002 0 010 1.51l8.421 4.679a3 3 0 11-.729 1.31l-8.421-4.679a3 3 0 110-4.132l8.421-4.679a3 3 0 01-.096-.754z" clipRule="evenodd" />
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
// Encapsulates all play/pause detection logic via iframe 
// focus tracking. Implements the Strategy pattern for state 
// transitions between the 3 HUD modes.
// ─────────────────────────────────────────────────────────
function usePlayerState() {
  const [isPaused, setIsPaused] = useState(false);
  const [showTitleCard, setShowTitleCard] = useState(false);
  const titleCardTimerRef = useRef(null);

  // We removed the blur/focus detection because it is unreliable for tracking
  // iframe clicks due to browser security boundaries (CORS). It was causing the 
  // title card to appear while playing.
  useEffect(() => {
    // Spacebar is handled in the main component.
  }, []);

  // State 3: When paused, show title card after 2.5s of mouse inactivity
  useEffect(() => {
    if (isPaused) {
      // Start the 2.5s timer for title card
      titleCardTimerRef.current = setTimeout(() => {
        setShowTitleCard(true);
      }, 2500);
    } else {
      // Playing: immediately hide title card
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

  // Reset the 2.5s timer on mouse activity while paused
  const handleMouseActivity = useCallback(() => {
    if (!isPaused) return; // Only matters when paused

    setShowTitleCard(false);
    if (titleCardTimerRef.current) {
      clearTimeout(titleCardTimerRef.current);
    }
    titleCardTimerRef.current = setTimeout(() => {
      setShowTitleCard(true);
    }, 2500);
  }, [isPaused]);

  return { isPaused, showTitleCard, handleMouseActivity, setIsPaused };
}

// ─────────────────────────────────────────────────────────
// Dynamic Episode Selector Component
// Fetches real data from TMDB. Follows Interface Segregation 
// by only exposing what the parent needs via props.
// ─────────────────────────────────────────────────────────
function EpisodeSelector({ 
  movieId, 
  seasons, 
  currentSeason, 
  currentEpisode, 
  onSeasonChange, 
  onEpisodeChange 
}) {
  const { data: seasonData, isLoading: episodesLoading } = useSeasonDetails(movieId, currentSeason);

  const episodes = seasonData?.episodes || [];

  return (
    <motion.div 
      className="episode-selector"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      {/* Season Dropdown */}
      <div className="selector-group">
        <label>Season</label>
        <div className="select-wrapper">
          <select 
            value={currentSeason} 
            onChange={(e) => onSeasonChange(Number(e.target.value))}
          >
            {(seasons || []).map(s => (
              <option key={s.seasonNumber} value={s.seasonNumber}>
                {s.name || `Season ${s.seasonNumber}`}
              </option>
            ))}
          </select>
          <ChevronDownIcon />
        </div>
      </div>
      
      {/* Episode Dropdown — Real names from TMDB */}
      <div className="selector-group">
        <label>Episode</label>
        <div className="select-wrapper">
          <select 
            value={currentEpisode} 
            onChange={(e) => onEpisodeChange(Number(e.target.value))}
            disabled={episodesLoading}
          >
            {episodesLoading ? (
              <option>Loading...</option>
            ) : (
              episodes.map(ep => (
                <option key={ep.episodeNumber} value={ep.episodeNumber}>
                  {ep.episodeNumber}. {ep.name}
                </option>
              ))
            )}
          </select>
          <ChevronDownIcon />
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────
// Netflix-Style Title Card Component
// Shown only in State 3 (paused + 2.5s idle).
// ─────────────────────────────────────────────────────────
function TitleCard({ content, mediaType, season, episode, seasonData }) {
  const currentEpisode = seasonData?.episodes?.find(ep => ep.episodeNumber === episode);
  
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
            <span className="title-card-episode-tag">
              S{season} E{episode}
            </span>
            <span className="title-card-episode-name">{currentEpisode.name}</span>
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
              {content.genres.slice(0, 3).map(g => g.name).join(' · ')}
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
// Main Watch Page Component (Facade Pattern)
// Orchestrates all sub-components and manages global state.
// ─────────────────────────────────────────────────────────
function WatchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const movieId = searchParams.get('id');
  const mediaType = searchParams.get('type') || 'movie';
  const initialSeason = Number(searchParams.get('s')) || 1;
  const initialEpisode = Number(searchParams.get('e')) || 1;
  
  // State for TV show episode selection
  const [season, setSeason] = useState(initialSeason);
  const [episode, setEpisode] = useState(initialEpisode);
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  
  // Player state (3-state HUD logic)
  const { isPaused, showTitleCard, handleMouseActivity, setIsPaused } = usePlayerState();

  // Fetch movie/show details
  const { data: content, isLoading: contentLoading } = useMovieDetails(movieId, mediaType);
  
  // Fetch season details for episode names (only for TV)
  const { data: seasonData } = useSeasonDetails(
    mediaType === 'tv' ? movieId : null, 
    mediaType === 'tv' ? season : null
  );
  
  // Generate embed URL based on media type
  const getEmbedUrl = useCallback(() => {
    if (!movieId) return '';
    
    if (mediaType === 'tv') {
      return `https://www.2embed.cc/embedtv/${movieId}&s=${season}&e=${episode}`;
    }
    return `https://www.2embed.cc/embed/${movieId}`;
  }, [movieId, mediaType, season, episode]);
  
  // Handle back navigation
  const handleBack = useCallback(() => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  }, [router]);
  
  // Update URL when season/episode changes
  const handleSeasonChange = useCallback((newSeason) => {
    setSeason(newSeason);
    setEpisode(1);
    setIsIframeLoading(true);
    setIsPaused(false);
    router.replace(`/watch?id=${movieId}&type=${mediaType}&s=${newSeason}&e=1`, { scroll: false });
  }, [movieId, mediaType, router, setIsPaused]);
  
  const handleEpisodeChange = useCallback((newEpisode) => {
    setEpisode(newEpisode);
    setIsIframeLoading(true);
    setIsPaused(false);
    router.replace(`/watch?id=${movieId}&type=${mediaType}&s=${season}&e=${newEpisode}`, { scroll: false });
  }, [movieId, mediaType, season, router, setIsPaused]);
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleBack();
      }
      // Space key toggles pause state
      if (e.key === ' ') {
        setIsPaused(prev => !prev);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleBack, setIsPaused]);
  
  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);
  
  // Handle iframe load
  const handleIframeLoad = useCallback(() => {
    setIsIframeLoading(false);
  }, []);
  
  // Redirect if no movie ID
  useEffect(() => {
    if (!movieId) {
      router.push('/');
    }
  }, [movieId, router]);
  
  if (!movieId) return null;
  
  const title = content?.title || content?.name || 'Loading...';
  const realSeasons = content?.seasons || [];
  
  return (
    <div 
      className={`watch-container ${isPaused ? 'is-paused' : 'is-playing'} ${showTitleCard ? 'show-title-card' : ''}`}
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
            key={getEmbedUrl()}
            src={getEmbedUrl()}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation"
            className="watch-iframe"
            onLoad={handleIframeLoad}
          />
        </motion.div>
      </div>
      
      {/* ─── Pause Overlay (State 3: Dimmed backdrop when title card shows) ─── */}
      <AnimatePresence>
        {showTitleCard && (
          <motion.div 
            className="pause-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          />
        )}
      </AnimatePresence>

      {/* ─── Top Controls (Only visible when paused + title card) ─── */}
      <AnimatePresence>
        {showTitleCard && (
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

            {/* Episode Selector for TV Shows */}
            {mediaType === 'tv' && realSeasons.length > 0 && (
              <EpisodeSelector
                movieId={movieId}
                seasons={realSeasons}
                currentSeason={season}
                currentEpisode={episode}
                onSeasonChange={handleSeasonChange}
                onEpisodeChange={handleEpisodeChange}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Netflix Title Card (State 3 only: paused + 2.5s idle) ─── */}
      <AnimatePresence>
        {showTitleCard && content && (
          <TitleCard 
            content={content} 
            mediaType={mediaType} 
            season={season} 
            episode={episode}
            seasonData={seasonData}
          />
        )}
      </AnimatePresence>

      {/* ─── Gradient overlays (Only with title card for readability) ─── */}
      <AnimatePresence>
        {showTitleCard && (
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
