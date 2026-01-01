'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useMovieDetails } from '@/hooks/useMovies';
import './watch.css';

// Icons
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

const LoadingSpinner = () => (
  <div className="watch-loading">
    <div className="watch-spinner"></div>
    <p>Loading player...</p>
  </div>
);

// Episode Selector Component for TV Shows
function EpisodeSelector({ seasons, currentSeason, currentEpisode, onSeasonChange, onEpisodeChange }) {
  const seasonNumbers = Array.from({ length: seasons || 1 }, (_, i) => i + 1);
  // Default to 10 episodes per season if we don't have exact data
  const episodeNumbers = Array.from({ length: 24 }, (_, i) => i + 1);

  return (
    <motion.div 
      className="episode-selector"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="selector-group">
        <label>Season</label>
        <div className="select-wrapper">
          <select 
            value={currentSeason} 
            onChange={(e) => onSeasonChange(Number(e.target.value))}
          >
            {seasonNumbers.map(num => (
              <option key={num} value={num}>Season {num}</option>
            ))}
          </select>
          <ChevronDownIcon />
        </div>
      </div>
      
      <div className="selector-group">
        <label>Episode</label>
        <div className="select-wrapper">
          <select 
            value={currentEpisode} 
            onChange={(e) => onEpisodeChange(Number(e.target.value))}
          >
            {episodeNumbers.map(num => (
              <option key={num} value={num}>Episode {num}</option>
            ))}
          </select>
          <ChevronDownIcon />
        </div>
      </div>
    </motion.div>
  );
}

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
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch movie/show details
  const { data: content, isLoading: contentLoading } = useMovieDetails(movieId, mediaType);
  
  // Generate embed URL based on media type
  // Using 2embed.cc for movies and TV shows
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
    setEpisode(1); // Reset to episode 1 when changing seasons
    setIsLoading(true);
    router.replace(`/watch?id=${movieId}&type=${mediaType}&s=${newSeason}&e=1`, { scroll: false });
  }, [movieId, mediaType, router]);
  
  const handleEpisodeChange = useCallback((newEpisode) => {
    setEpisode(newEpisode);
    setIsLoading(true);
    router.replace(`/watch?id=${movieId}&type=${mediaType}&s=${season}&e=${newEpisode}`, { scroll: false });
  }, [movieId, mediaType, season, router]);
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleBack();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleBack]);
  
  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);
  
  // Handle iframe load
  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
  }, []);
  
  // Redirect if no movie ID
  useEffect(() => {
    if (!movieId) {
      router.push('/');
    }
  }, [movieId, router]);
  
  if (!movieId) return null;
  
  const title = content?.title || content?.name || 'Loading...';
  const numberOfSeasons = content?.numberOfSeasons || 10;
  
  return (
    <div className="watch-container">
      {/* Back Button */}
      <motion.button
        className="watch-back-btn"
        onClick={handleBack}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <BackIcon />
        <span>Back</span>
      </motion.button>
      
      {/* Movie/Show Info Overlay */}
      <AnimatePresence>
        {content && (
          <motion.div 
            className="watch-info"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="watch-title">{title}</h1>
            {mediaType === 'tv' && (
              <p className="watch-episode-info">
                Season {season}, Episode {episode}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Episode Selector for TV Shows */}
      {mediaType === 'tv' && (
        <EpisodeSelector
          seasons={numberOfSeasons}
          currentSeason={season}
          currentEpisode={episode}
          onSeasonChange={handleSeasonChange}
          onEpisodeChange={handleEpisodeChange}
        />
      )}
      
      {/* Video Player Area */}
      <div className="watch-player-wrapper">
        {(contentLoading || isLoading) && <LoadingSpinner />}
        
        <motion.div 
          className="watch-player"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: isLoading ? 0 : 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <iframe
            key={getEmbedUrl()} // Force re-render on URL change
            src={getEmbedUrl()}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            className="watch-iframe"
            onLoad={handleIframeLoad}
          />
        </motion.div>
      </div>
      
      {/* Gradient overlays for aesthetics */}
      <div className="watch-gradient-top" />
      <div className="watch-gradient-bottom" />
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
