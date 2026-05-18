'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { useContinueWatching, useRemoveFromContinueWatching } from '@/hooks/useMovies';
import { useAuth } from '@/contexts/AuthContext';
import { useHorizontalScroll } from '@/hooks/useInfiniteScroll';

const ChevronLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z" clipRule="evenodd" />
  </svg>
);

const ChevronRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path fillRule="evenodd" d="M16.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 011.06-1.06l7.5 7.5z" clipRule="evenodd" />
  </svg>
);

function getTimeAgo(dateString) {
  if (!dateString) return null;
  const diff = Date.now() - new Date(dateString).getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return null;
}

function ContinueCard({ item, onResume, onRemove }) {
  const [isHovered, setIsHovered] = useState(false);

  const imageUrl = item.backdropPath || item.posterPath;
  const isTV = item.mediaType === 'tv';
  const episodeLabel = isTV && item.season ? `S${item.season} · E${item.episode}` : null;
  const timeAgo = getTimeAgo(item.lastWatched);
  const progressPct = Math.max(2, Math.min(100, item.progress || 0));

  return (
    <motion.div
      className="relative flex-shrink-0 w-64 cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onResume(item)}
      whileHover={{ scale: 1.04, zIndex: 10 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {/* 16:9 image container */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-zinc-900">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={item.title || 'Continue watching'}
            fill
            sizes="256px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
            <svg className="w-10 h-10 text-white/20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h8.25a3 3 0 003-3v-9a3 3 0 00-3-3H4.5zM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06z" />
            </svg>
          </div>
        )}

        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

        {/* Play button (hover) */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-xl">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5 text-black translate-x-0.5"
                >
                  <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                </svg>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Remove button */}
        <motion.button
          className={clsx(
            'absolute top-2 right-2 z-10',
            'w-7 h-7 rounded-full',
            'bg-black/60 backdrop-blur-sm',
            'flex items-center justify-center',
            'text-white/70 hover:text-white hover:bg-black/90',
            'transition-all duration-150',
            'opacity-0 group-hover:opacity-100'
          )}
          onClick={(e) => { e.stopPropagation(); onRemove(item); }}
          whileTap={{ scale: 0.9 }}
          aria-label="Remove from continue watching"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
          </svg>
        </motion.button>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20">
          <div
            className="h-full bg-red-500 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Info below image */}
      <div className="mt-2 px-0.5">
        <h4 className="text-white/90 text-sm font-semibold truncate leading-snug">
          {item.title}
        </h4>
        <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
          {episodeLabel && (
            <span className="text-white/55 text-xs font-medium flex-shrink-0">
              {episodeLabel}
            </span>
          )}
          {episodeLabel && item.episodeTitle && (
            <span className="text-white/30 text-xs">·</span>
          )}
          {item.episodeTitle ? (
            <span className="text-white/40 text-xs truncate">{item.episodeTitle}</span>
          ) : (
            timeAgo && !episodeLabel && (
              <span className="text-white/40 text-xs">{timeAgo}</span>
            )
          )}
          {episodeLabel && !item.episodeTitle && timeAgo && (
            <span className="text-white/30 text-xs flex-shrink-0">{timeAgo}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ContinueCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-64">
      <div className="aspect-video rounded-xl skeleton" />
      <div className="mt-2 h-4 w-40 skeleton rounded" />
      <div className="mt-1 h-3 w-24 skeleton rounded" />
    </div>
  );
}

export default function ContinueWatchingRow() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  const { data, isLoading } = useContinueWatching();
  const removeItem = useRemoveFromContinueWatching();

  const { containerRef, canScrollLeft, canScrollRight, scrollLeft, scrollRight } =
    useHorizontalScroll(undefined, { threshold: 200 });

  const items = data?.continueWatching || [];

  const handleResume = useCallback((item) => {
    const url =
      item.mediaType === 'tv' && item.season
        ? `/watch?id=${item.movieId}&type=tv&s=${item.season}&e=${item.episode || 1}`
        : `/watch?id=${item.movieId}&type=${item.mediaType || 'movie'}`;
    router.push(url);
  }, [router]);

  const handleRemove = useCallback((item) => {
    removeItem.mutate(item.movieId);
  }, [removeItem]);

  // Don't render if not authenticated or no items (and not loading)
  if (!isAuthenticated) return null;
  if (!isLoading && items.length === 0) return null;

  return (
    <section
      className="relative py-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Row title */}
      <div className="container-fluid mb-4 flex items-center gap-3">
        <h2 className="heading-md text-white">Continue Watching</h2>
        <span className="label text-white/30">For You</span>
      </div>

      <div className="relative group">
        {/* Left arrow */}
        <motion.button
          className={clsx(
            'absolute left-2 top-[45%] -translate-y-1/2 z-20',
            'w-12 h-12 rounded-full',
            'bg-black/60 backdrop-blur-md',
            'flex items-center justify-center',
            'text-white hover:bg-black/80',
            'transition-all duration-200',
            'focus:outline-none'
          )}
          onClick={scrollLeft}
          initial={{ opacity: 0, x: -10 }}
          animate={{
            opacity: canScrollLeft && isHovered ? 1 : 0,
            x: canScrollLeft && isHovered ? 0 : -10,
          }}
          aria-label="Scroll left"
          disabled={!canScrollLeft}
        >
          <ChevronLeft />
        </motion.button>

        {/* Cards container */}
        <div ref={containerRef} className="row-scroll px-6 lg:px-10">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => <ContinueCardSkeleton key={i} />)
            : items.map((item) => (
                <ContinueCard
                  key={`${item.movieId}-${item.season ?? 0}-${item.episode ?? 0}`}
                  item={item}
                  onResume={handleResume}
                  onRemove={handleRemove}
                />
              ))}
        </div>

        {/* Right arrow */}
        <motion.button
          className={clsx(
            'absolute right-2 top-[45%] -translate-y-1/2 z-20',
            'w-12 h-12 rounded-full',
            'bg-black/60 backdrop-blur-md',
            'flex items-center justify-center',
            'text-white hover:bg-black/80',
            'transition-all duration-200',
            'focus:outline-none'
          )}
          onClick={scrollRight}
          initial={{ opacity: 0, x: 10 }}
          animate={{
            opacity: canScrollRight && isHovered ? 1 : 0,
            x: canScrollRight && isHovered ? 0 : 10,
          }}
          aria-label="Scroll right"
          disabled={!canScrollRight}
        >
          <ChevronRight />
        </motion.button>

        {/* Gradient fades */}
        <div className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-[#050505] to-transparent pointer-events-none z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-[#050505] to-transparent pointer-events-none z-10" />
      </div>
    </section>
  );
}
