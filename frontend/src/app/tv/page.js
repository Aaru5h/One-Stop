'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import Hero from '@/components/Hero';
import MovieRow, { MovieRowSkeleton } from '@/components/MovieRow';
import MovieModal from '@/components/MovieModal';
import { useTrending, usePopular, useTopRated, useMovieDetails, useMoviesByGenre } from '@/hooks/useMovies';

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
    console.log('Add to watchlist:', show.title || show.name);
  }, []);

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
            isInWatchlist={selectedShow.isInWatchlist}
            layoutId={`tv-${selectedShow.id}`}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
