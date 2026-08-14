'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import MovieCard, { MovieCardSkeleton } from '@/components/MovieCard';
import MovieModal from '@/components/MovieModal';
import { GlassPanel } from '@/components/ui/GlassCard';
import { useSearch, useMovieDetails, useWatchlist, useAddToWatchlist, useRemoveFromWatchlist } from '@/hooks/useMovies';
import { useToast } from '@/contexts/ToastContext';
import useInfiniteScroll from '@/hooks/useInfiniteScroll';

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clipRule="evenodd" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
  </svg>
);

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Debounce search query
  const debouncedQuery = useDebounce(query, 400);

  // Search results
  const { data: searchData, isLoading, isFetching } = useSearch(debouncedQuery);

  // Movie details for modal
  const { data: movieDetails } = useMovieDetails(
    selectedMovie?.id,
    selectedMovie?.mediaType || 'movie'
  );

  // Watchlist functionality
  const { data: watchlistData } = useWatchlist();
  const addToWatchlist = useAddToWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();

  const watchlistIds = useMemo(() => {
    const watchlist = watchlistData?.watchlist || [];
    return new Set(watchlist.map(item => item.movieId));
  }, [watchlistData]);

  const isSelectedMovieInWatchlist = useMemo(() => {
    if (!selectedMovie) return false;
    return watchlistIds.has(selectedMovie.id);
  }, [selectedMovie, watchlistIds]);

  const { showWatchlistAdded, showWatchlistRemoved, showError } = useToast();

  const handleToggleWatchlist = useCallback((movie) => {
    const movieId = movie.id;
    const isInWatchlist = watchlistIds.has(movieId);
    const itemTitle = movie.title || movie.name;

    if (isInWatchlist) {
      removeFromWatchlist.mutate(movieId, {
        onSuccess: () => {
          showWatchlistRemoved(itemTitle, movie.posterPath);
        },
        onError: (error) => {
          if (error.response?.status === 401) {
            showError('Please log in to manage your watchlist', itemTitle);
          } else {
            showError('Failed to remove from watchlist', itemTitle);
          }
        }
      });
    } else {
      addToWatchlist.mutate({
        movieId,
        data: {
          title: itemTitle,
          posterPath: movie.posterPath,
          mediaType: movie.mediaType || 'movie'
        }
      }, {
        onSuccess: () => {
          showWatchlistAdded(itemTitle, movie.posterPath);
        },
        onError: (error) => {
          if (error.response?.status === 401) {
            showError('Please log in to add to your watchlist', itemTitle);
          } else {
            showError('Failed to add to watchlist', itemTitle);
          }
        }
      });
    }
  }, [watchlistIds, addToWatchlist, removeFromWatchlist, showWatchlistAdded, showWatchlistRemoved, showError]);

  const handleMovieClick = (movie) => {
    setSelectedMovie(movie);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedMovie(null), 300);
  };

  const handlePlay = useCallback((movie) => {
    const mediaType = movie.mediaType || 'movie';
    router.push(`/watch?id=${movie.id}&type=${mediaType}`);
  }, [router]);

  const clearSearch = () => {
    setQuery('');
  };

  const results = searchData?.results || [];
  const hasQuery = debouncedQuery.length >= 2;
  const showEmpty = hasQuery && !isLoading && results.length === 0;

  return (
    <div className="min-h-screen pt-24 pb-32">
      <div className="container-fluid">
        {/* Search Header */}
        <div className="max-w-2xl mx-auto mb-12">
          <h1 className="heading-xl text-white text-center mb-8">
            Search
          </h1>

          {/* Search Input */}
          <GlassPanel className="!p-2">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">
                <SearchIcon />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for movies and TV shows..."
                className={clsx(
                  'w-full h-14 pl-14 pr-14 rounded-xl',
                  'bg-transparent text-white text-lg',
                  'placeholder:text-white/40',
                  'focus:outline-none'
                )}
                autoFocus
              />
              {query && (
                <button
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                >
                  <CloseIcon />
                </button>
              )}
            </div>
          </GlassPanel>
        </div>

        {/* Loading State */}
        {isLoading && hasQuery && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <MovieCardSkeleton key={i} size="lg" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {showEmpty && (
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-6xl mb-4">🎬</div>
            <h3 className="heading-md text-white mb-2">No results found</h3>
            <p className="text-secondary">
              Try searching for something else
            </p>
          </motion.div>
        )}

        {/* Initial State */}
        {!hasQuery && (
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="heading-md text-white mb-2">Find your next watch</h3>
            <p className="text-secondary">
              Search for movies and TV shows
            </p>
          </motion.div>
        )}

        {/* Results Grid */}
        {hasQuery && results.length > 0 && (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <AnimatePresence mode="popLayout">
              {results.map((movie, index) => (
                <motion.div
                  key={movie.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <MovieCard
                    movie={movie}
                    onClick={handleMovieClick}
                    onPlay={handlePlay}
                    onAddToWatchlist={handleToggleWatchlist}
                    isInWatchlist={watchlistIds.has(movie.id)}
                    size="lg"
                    layoutId={`search-movie-${movie.id}`}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Fetching Indicator */}
        {isFetching && hasQuery && results.length > 0 && (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Movie Modal */}
      <MovieModal
        movie={movieDetails || selectedMovie}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onPlay={handlePlay}
        isInWatchlist={isSelectedMovieInWatchlist}
        onToggleWatchlist={handleToggleWatchlist}
        layoutId={selectedMovie ? `search-movie-${selectedMovie.id}` : undefined}
      />
    </div>
  );
}
