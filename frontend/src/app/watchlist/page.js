'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MovieCard, { MovieCardSkeleton } from '@/components/MovieCard';
import MovieModal from '@/components/MovieModal';
import { GlassPanel } from '@/components/ui/GlassCard';
import MagneticButton from '@/components/ui/MagneticButton';
import { useWatchlist, useRemoveFromWatchlist, useMovieDetails } from '@/hooks/useMovies';

export default function WatchlistPage() {
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch watchlist
  const { data: watchlistData, isLoading } = useWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();

  // Movie details for modal
  const { data: movieDetails } = useMovieDetails(
    selectedMovie?.movieId || selectedMovie?.id,
    selectedMovie?.mediaType || 'movie'
  );

  const watchlist = watchlistData?.watchlist || [];

  const handleMovieClick = useCallback((movie) => {
    setSelectedMovie(movie);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedMovie(null), 300);
  }, []);

  const handleRemoveFromWatchlist = useCallback((movie) => {
    removeFromWatchlist.mutate(movie.movieId || movie.id);
  }, [removeFromWatchlist]);

  // Transform watchlist items to match MovieCard expected format
  const movies = watchlist.map(item => ({
    id: item.movieId,
    title: item.title,
    posterPath: item.posterPath,
    mediaType: item.mediaType,
    addedAt: item.addedAt
  }));

  return (
    <div className="min-h-screen pt-24 pb-32">
      <div className="container-fluid">
        {/* Header */}
        <div className="mb-12">
          <h1 className="heading-xl text-white mb-2">
            My Watchlist
          </h1>
          <p className="text-secondary">
            {movies.length} {movies.length === 1 ? 'title' : 'titles'}
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <MovieCardSkeleton key={i} size="lg" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && movies.length === 0 && (
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlassPanel className="inline-block px-16 py-12">
              <div className="text-7xl mb-6">📑</div>
              <h3 className="heading-md text-white mb-3">Your watchlist is empty</h3>
              <p className="text-secondary mb-8 max-w-sm">
                Start adding movies and shows you want to watch later
              </p>
              <MagneticButton 
                variant="primary"
                onClick={() => window.location.href = '/'}
              >
                Browse Content
              </MagneticButton>
            </GlassPanel>
          </motion.div>
        )}

        {/* Watchlist Grid */}
        {!isLoading && movies.length > 0 && (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AnimatePresence mode="popLayout">
              {movies.map((movie, index) => (
                <motion.div
                  key={movie.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  transition={{ delay: index * 0.02 }}
                  layout
                >
                  <div className="relative group">
                    <MovieCard
                      movie={movie}
                      onClick={handleMovieClick}
                      size="lg"
                      layoutId={`watchlist-movie-${movie.id}`}
                    />
                    
                    {/* Remove button */}
                    <motion.button
                      className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFromWatchlist(movie);
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      aria-label="Remove from watchlist"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                      </svg>
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Movie Modal */}
      <MovieModal
        movie={movieDetails || selectedMovie}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        isInWatchlist={true}
        onToggleWatchlist={handleRemoveFromWatchlist}
        layoutId={selectedMovie ? `watchlist-movie-${selectedMovie.id}` : undefined}
      />
    </div>
  );
}
