'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import Hero from '@/components/Hero';
import MovieRow, { MovieRowSkeleton } from '@/components/MovieRow';
import MovieModal from '@/components/MovieModal';
import { useTrending, usePopular, useTopRated, useNowPlaying, useMovieDetails, useWatchlist, useAddToWatchlist, useRemoveFromWatchlist } from '@/hooks/useMovies';

// Genre configurations with IDs from TMDB
const GENRE_ROWS = [
  { id: 28, name: 'Action' },
  { id: 35, name: 'Comedy' },
  { id: 18, name: 'Drama' },
  { id: 878, name: 'Sci-Fi' },
  { id: 27, name: 'Horror' },
  { id: 10749, name: 'Romance' },
];

export default function HomePage() {
  const router = useRouter();
  
  // Selected movie for modal
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch movie data
  const { data: trendingData, isLoading: trendingLoading } = useTrending({ mediaType: 'movie' });
  const { data: popularData, isLoading: popularLoading } = usePopular({ mediaType: 'movie' });
  const { data: topRatedData, isLoading: topRatedLoading } = useTopRated({ mediaType: 'movie' });
  const { data: nowPlayingData, isLoading: nowPlayingLoading } = useNowPlaying({ mediaType: 'movie' });

  // Fetch movie details when modal is opened
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

  // Hero movie (first trending)
  const heroMovie = trendingData?.results?.[0];

  // Handlers
  const handleMovieClick = useCallback((movie) => {
    setSelectedMovie(movie);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    // Delay clearing movie to allow exit animation
    setTimeout(() => setSelectedMovie(null), 300);
  }, []);

  const handlePlay = useCallback((movie) => {
    const mediaType = movie.mediaType || 'movie';
    router.push(`/watch?id=${movie.id}&type=${mediaType}`);
  }, [router]);

  const handleAddToWatchlist = useCallback((movie) => {
    const movieId = movie.id;
    const isInWatchlist = watchlistIds.has(movieId);

    if (isInWatchlist) {
      removeFromWatchlist.mutate(movieId, {
        onError: (error) => {
          if (error.response?.status === 401) {
            alert('Please log in to manage your watchlist');
          } else {
            alert('Failed to remove from watchlist');
          }
        }
      });
    } else {
      addToWatchlist.mutate({
        movieId,
        data: {
          title: movie.title,
          posterPath: movie.posterPath,
          mediaType: movie.mediaType || 'movie'
        }
      }, {
        onError: (error) => {
          if (error.response?.status === 401) {
            alert('Please log in to add to your watchlist');
          } else {
            alert('Failed to add to watchlist');
          }
        }
      });
    }
  }, [watchlistIds, addToWatchlist, removeFromWatchlist]);

  const handleMoreInfo = useCallback((movie) => {
    handleMovieClick(movie);
  }, [handleMovieClick]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Hero
        movie={heroMovie}
        isLoading={trendingLoading}
        onPlay={handlePlay}
        onAddToWatchlist={handleAddToWatchlist}
        onMoreInfo={handleMoreInfo}
      />

      {/* Content Rows */}
      <div className="relative z-10 -mt-32 space-y-8 pb-32">
        {/* Trending Now */}
        {trendingLoading ? (
          <MovieRowSkeleton title="Trending Now" />
        ) : (
          <MovieRow
            title="Trending Now"
            movies={trendingData?.results?.slice(1) || []}
            onMovieClick={handleMovieClick}
            onPlay={handlePlay}
            onAddToWatchlist={handleAddToWatchlist}
            watchlistIds={watchlistIds}
          />
        )}

        {/* Popular Movies */}
        {popularLoading ? (
          <MovieRowSkeleton title="Popular Movies" />
        ) : (
          <MovieRow
            title="Popular Movies"
            movies={popularData?.results || []}
            onMovieClick={handleMovieClick}
            onPlay={handlePlay}
            onAddToWatchlist={handleAddToWatchlist}
            watchlistIds={watchlistIds}
          />
        )}

        {/* Now Playing */}
        {nowPlayingLoading ? (
          <MovieRowSkeleton title="Now Playing" />
        ) : (
          <MovieRow
            title="Now Playing"
            movies={nowPlayingData?.results || []}
            onMovieClick={handleMovieClick}
            onPlay={handlePlay}
            onAddToWatchlist={handleAddToWatchlist}
            watchlistIds={watchlistIds}
          />
        )}

        {/* Top Rated */}
        {topRatedLoading ? (
          <MovieRowSkeleton title="Top Rated" />
        ) : (
          <MovieRow
            title="Top Rated"
            movies={topRatedData?.results || []}
            onMovieClick={handleMovieClick}
            onPlay={handlePlay}
            onAddToWatchlist={handleAddToWatchlist}
            watchlistIds={watchlistIds}
          />
        )}
      </div>

      {/* Movie Detail Modal */}
      <AnimatePresence>
        {isModalOpen && selectedMovie && (
          <MovieModal
            movie={movieDetails || selectedMovie}
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onPlay={handlePlay}
            onToggleWatchlist={handleAddToWatchlist}
            isInWatchlist={isSelectedMovieInWatchlist}
            layoutId={`movie-${selectedMovie.id}`}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
