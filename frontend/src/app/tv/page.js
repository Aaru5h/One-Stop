'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import Hero from '@/components/Hero';
import MovieRow, { MovieRowSkeleton } from '@/components/MovieRow';
import MovieModal from '@/components/MovieModal';
import { useTrending, usePopular, useTopRated, useMovieDetails, useMoviesByGenre, useWatchlist, useAddToWatchlist, useRemoveFromWatchlist } from '@/hooks/useMovies';
import { useToast } from '@/contexts/ToastContext';

// Genre configurations for TV shows
const TV_GENRES = [
  { id: 10759, name: 'Action & Adventure' },
  { id: 35, name: 'Comedy' },
  { id: 18, name: 'Drama' },
  { id: 10765, name: 'Sci-Fi & Fantasy' },
  { id: 9648, name: 'Mystery' },
  { id: 80, name: 'Crime' },
  { id: 10751, name: 'Family' },
  { id: 10762, name: 'Kids' },
];

export default function TVShowsPage() {
  const router = useRouter();
  const [selectedShow, setSelectedShow] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Watchlist functionality
  const { data: watchlistData } = useWatchlist();
  const addToWatchlist = useAddToWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();
  const { showWatchlistAdded, showWatchlistRemoved, showError } = useToast();

  const watchlistIds = useMemo(() => {
    const watchlist = watchlistData?.watchlist || [];
    return new Set(watchlist.map(item => item.movieId));
  }, [watchlistData]);

  // Fetch TV show data
  const { data: trendingData, isLoading: trendingLoading } = useTrending({ mediaType: 'tv' });
  const { data: popularData, isLoading: popularLoading } = usePopular({ mediaType: 'tv' });
  const { data: topRatedData, isLoading: topRatedLoading } = useTopRated({ mediaType: 'tv' });

  // Genre data for TV shows
  const { data: actionData, isLoading: actionLoading } = useMoviesByGenre(10759, { mediaType: 'tv' });
  const { data: comedyData, isLoading: comedyLoading } = useMoviesByGenre(35, { mediaType: 'tv' });
  const { data: dramaData, isLoading: dramaLoading } = useMoviesByGenre(18, { mediaType: 'tv' });
  const { data: scifiData, isLoading: scifiLoading } = useMoviesByGenre(10765, { mediaType: 'tv' });
  const { data: mysteryData, isLoading: mysteryLoading } = useMoviesByGenre(9648, { mediaType: 'tv' });
  const { data: crimeData, isLoading: crimeLoading } = useMoviesByGenre(80, { mediaType: 'tv' });

  // Show details for modal
  const { data: showDetails } = useMovieDetails(
    selectedShow?.id,
    selectedShow?.mediaType || 'tv'
  );

  // Hero show
  const heroShow = popularData?.results?.[0];

  // Handlers
  const handleShowClick = useCallback((show) => {
    setSelectedShow({ ...show, mediaType: 'tv' });
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedShow(null), 300);
  }, []);

  const handlePlay = useCallback((show) => {
    const mediaType = show.mediaType || 'tv';
    router.push(`/watch?id=${show.id}&type=${mediaType}`);
  }, [router]);

  const handleAddToWatchlist = useCallback((show) => {
    const movieId = show.id;
    const isInWatchlist = watchlistIds.has(movieId);
    const itemTitle = show.title || show.name;

    if (isInWatchlist) {
      removeFromWatchlist.mutate(movieId, {
        onSuccess: () => {
          showWatchlistRemoved(itemTitle, show.posterPath);
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
          posterPath: show.posterPath,
          mediaType: 'tv'
        }
      }, {
        onSuccess: () => {
          showWatchlistAdded(itemTitle, show.posterPath);
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

  const handleMoreInfo = useCallback((show) => {
    handleShowClick(show);
  }, [handleShowClick]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Hero
        movie={heroShow}
        isLoading={popularLoading}
        onPlay={handlePlay}
        onAddToWatchlist={handleAddToWatchlist}
        onMoreInfo={handleMoreInfo}
        isInWatchlist={heroShow ? watchlistIds.has(heroShow.id) : false}
      />

      {/* Content Rows */}
      <div className="relative z-10 -mt-32 space-y-8 pb-32">
        {/* Trending TV Shows */}
        {trendingLoading ? (
          <MovieRowSkeleton title="Trending TV Shows" />
        ) : (
          <MovieRow
            title="🔥 Trending TV Shows"
            movies={trendingData?.results || []}
            onMovieClick={handleShowClick}
            onPlay={handlePlay}
            onAddToWatchlist={handleAddToWatchlist}
            watchlistIds={watchlistIds}
          />
        )}

        {/* Popular TV Shows */}
        {popularLoading ? (
          <MovieRowSkeleton title="Popular TV Shows" />
        ) : (
          <MovieRow
            title="Popular TV Shows"
            movies={popularData?.results?.slice(1) || []}
            onMovieClick={handleShowClick}
            onPlay={handlePlay}
            onAddToWatchlist={handleAddToWatchlist}
            watchlistIds={watchlistIds}
          />
        )}

        {/* Top Rated */}
        {topRatedLoading ? (
          <MovieRowSkeleton title="Top Rated Shows" />
        ) : (
          <MovieRow
            title="⭐ Top Rated Shows"
            movies={topRatedData?.results || []}
            onMovieClick={handleShowClick}
            onPlay={handlePlay}
            onAddToWatchlist={handleAddToWatchlist}
            watchlistIds={watchlistIds}
          />
        )}

        {/* Action & Adventure */}
        {actionLoading ? (
          <MovieRowSkeleton title="Action & Adventure" />
        ) : (
          <MovieRow
            title="💥 Action & Adventure"
            movies={actionData?.results || []}
            onMovieClick={handleShowClick}
            onPlay={handlePlay}
            onAddToWatchlist={handleAddToWatchlist}
            watchlistIds={watchlistIds}
          />
        )}

        {/* Comedy Shows */}
        {comedyLoading ? (
          <MovieRowSkeleton title="Comedy Shows" />
        ) : (
          <MovieRow
            title="😂 Comedy Shows"
            movies={comedyData?.results || []}
            onMovieClick={handleShowClick}
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
            title="🎭 Drama Series"
            movies={dramaData?.results || []}
            onMovieClick={handleShowClick}
            onPlay={handlePlay}
            onAddToWatchlist={handleAddToWatchlist}
            watchlistIds={watchlistIds}
          />
        )}

        {/* Sci-Fi & Fantasy */}
        {scifiLoading ? (
          <MovieRowSkeleton title="Sci-Fi & Fantasy" />
        ) : (
          <MovieRow
            title="🚀 Sci-Fi & Fantasy"
            movies={scifiData?.results || []}
            onMovieClick={handleShowClick}
            onPlay={handlePlay}
            onAddToWatchlist={handleAddToWatchlist}
            watchlistIds={watchlistIds}
          />
        )}

        {/* Mystery */}
        {mysteryLoading ? (
          <MovieRowSkeleton title="Mystery" />
        ) : (
          <MovieRow
            title="🔍 Mystery"
            movies={mysteryData?.results || []}
            onMovieClick={handleShowClick}
            onPlay={handlePlay}
            onAddToWatchlist={handleAddToWatchlist}
            watchlistIds={watchlistIds}
          />
        )}

        {/* Crime */}
        {crimeLoading ? (
          <MovieRowSkeleton title="Crime" />
        ) : (
          <MovieRow
            title="🔫 Crime"
            movies={crimeData?.results || []}
            onMovieClick={handleShowClick}
            onPlay={handlePlay}
            onAddToWatchlist={handleAddToWatchlist}
            watchlistIds={watchlistIds}
          />
        )}
      </div>

      {/* Show Detail Modal */}
      <AnimatePresence>
        {isModalOpen && selectedShow && (
          <MovieModal
            movie={showDetails || selectedShow}
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onPlay={handlePlay}
            onToggleWatchlist={handleAddToWatchlist}
            isInWatchlist={watchlistIds.has(selectedShow.id)}
            layoutId={`tv-${selectedShow.id}`}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
