'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import Hero from '@/components/Hero';
import MovieRow, { MovieRowSkeleton } from '@/components/MovieRow';
import MovieModal from '@/components/MovieModal';
import { useTrending, usePopular, useTopRated, useNowPlaying, useMovieDetails, useMoviesByGenre, useWatchlist, useAddToWatchlist, useRemoveFromWatchlist } from '@/hooks/useMovies';
import { useToast } from '@/contexts/ToastContext';

// Genre configurations for movies
const MOVIE_GENRES = [
  { id: 28, name: 'Action Movies' },
  { id: 35, name: 'Comedy Movies' },
  { id: 18, name: 'Drama' },
  { id: 878, name: 'Sci-Fi & Fantasy' },
  { id: 27, name: 'Horror' },
  { id: 10749, name: 'Romance' },
  { id: 53, name: 'Thrillers' },
  { id: 16, name: 'Animation' },
];

export default function MoviesPage() {
  const router = useRouter();
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch movie data
  const { data: trendingData, isLoading: trendingLoading } = useTrending({ mediaType: 'movie' });
  const { data: popularData, isLoading: popularLoading } = usePopular({ mediaType: 'movie' });
  const { data: topRatedData, isLoading: topRatedLoading } = useTopRated({ mediaType: 'movie' });
  const { data: nowPlayingData, isLoading: nowPlayingLoading } = useNowPlaying({ mediaType: 'movie' });

  // Genre data
  const { data: actionData, isLoading: actionLoading } = useMoviesByGenre(28, { mediaType: 'movie' });
  const { data: comedyData, isLoading: comedyLoading } = useMoviesByGenre(35, { mediaType: 'movie' });
  const { data: dramaData, isLoading: dramaLoading } = useMoviesByGenre(18, { mediaType: 'movie' });
  const { data: scifiData, isLoading: scifiLoading } = useMoviesByGenre(878, { mediaType: 'movie' });
  const { data: horrorData, isLoading: horrorLoading } = useMoviesByGenre(27, { mediaType: 'movie' });
  const { data: animationData, isLoading: animationLoading } = useMoviesByGenre(16, { mediaType: 'movie' });

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

  // Hero movie
  const heroMovie = popularData?.results?.[0];

  // Handlers
  const handleMovieClick = useCallback((movie) => {
    setSelectedMovie({ ...movie, mediaType: 'movie' });
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedMovie(null), 300);
  }, []);

  const handlePlay = useCallback((movie) => {
    const mediaType = movie.mediaType || 'movie';
    router.push(`/watch?id=${movie.id}&type=${mediaType}`);
  }, [router]);

  const { showWatchlistAdded, showWatchlistRemoved, showError } = useToast();

  const handleAddToWatchlist = useCallback((movie) => {
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

  const handleMoreInfo = useCallback((movie) => {
    handleMovieClick(movie);
  }, [handleMovieClick]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Hero
        movie={heroMovie}
        isLoading={popularLoading}
        onPlay={handlePlay}
        onAddToWatchlist={handleAddToWatchlist}
        onMoreInfo={handleMoreInfo}
        isInWatchlist={heroMovie ? watchlistIds.has(heroMovie.id) : false}
      />

      {/* Content Rows */}
      <div className="relative z-10 -mt-32 space-y-8 pb-32">
        {/* Trending Movies */}
        {trendingLoading ? (
          <MovieRowSkeleton title="Trending Movies" />
        ) : (
          <MovieRow
            title="🔥 Trending Movies"
            movies={trendingData?.results || []}
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
            movies={popularData?.results?.slice(1) || []}
            onMovieClick={handleMovieClick}
            onPlay={handlePlay}
            onAddToWatchlist={handleAddToWatchlist}
            watchlistIds={watchlistIds}
          />
        )}

        {/* Now Playing */}
        {nowPlayingLoading ? (
          <MovieRowSkeleton title="In Theaters Now" />
        ) : (
          <MovieRow
            title="🎬 In Theaters Now"
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
            title="⭐ Top Rated"
            movies={topRatedData?.results || []}
            onMovieClick={handleMovieClick}
            onPlay={handlePlay}
            onAddToWatchlist={handleAddToWatchlist}
            watchlistIds={watchlistIds}
          />
        )}

        {/* Action Movies */}
        {actionLoading ? (
          <MovieRowSkeleton title="Action Movies" />
        ) : (
          <MovieRow
            title="💥 Action Movies"
            movies={actionData?.results || []}
            onMovieClick={handleMovieClick}
            onPlay={handlePlay}
            onAddToWatchlist={handleAddToWatchlist}
            watchlistIds={watchlistIds}
          />
        )}

        {/* Comedy Movies */}
        {comedyLoading ? (
          <MovieRowSkeleton title="Comedy Movies" />
        ) : (
          <MovieRow
            title="😂 Comedy Movies"
            movies={comedyData?.results || []}
            onMovieClick={handleMovieClick}
            onPlay={handlePlay}
            onAddToWatchlist={handleAddToWatchlist}
            watchlistIds={watchlistIds}
          />
        )}

        {/* Drama */}
        {dramaLoading ? (
          <MovieRowSkeleton title="Drama" />
        ) : (
          <MovieRow
            title="🎭 Drama"
            movies={dramaData?.results || []}
            onMovieClick={handleMovieClick}
            onPlay={handlePlay}
            onAddToWatchlist={handleAddToWatchlist}
            watchlistIds={watchlistIds}
          />
        )}

        {/* Sci-Fi */}
        {scifiLoading ? (
          <MovieRowSkeleton title="Sci-Fi & Fantasy" />
        ) : (
          <MovieRow
            title="🚀 Sci-Fi & Fantasy"
            movies={scifiData?.results || []}
            onMovieClick={handleMovieClick}
            onPlay={handlePlay}
            onAddToWatchlist={handleAddToWatchlist}
            watchlistIds={watchlistIds}
          />
        )}

        {/* Horror */}
        {horrorLoading ? (
          <MovieRowSkeleton title="Horror" />
        ) : (
          <MovieRow
            title="👻 Horror"
            movies={horrorData?.results || []}
            onMovieClick={handleMovieClick}
            onPlay={handlePlay}
            onAddToWatchlist={handleAddToWatchlist}
            watchlistIds={watchlistIds}
          />
        )}

        {/* Animation */}
        {animationLoading ? (
          <MovieRowSkeleton title="Animation" />
        ) : (
          <MovieRow
            title="🎨 Animation"
            movies={animationData?.results || []}
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
