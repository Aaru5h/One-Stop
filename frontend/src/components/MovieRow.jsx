'use client';

import { useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import MovieCard, { MovieCardSkeleton } from './MovieCard';
import { useHorizontalScroll } from '@/hooks/useInfiniteScroll';

// Arrow icons
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

/**
 * MovieRow - Horizontal scrolling content row with navigation arrows
 * Supports infinite horizontal scroll for loading more content
 */
export default function MovieRow({
    title,
    movies = [],
    isLoading = false,
    onMovieClick,
    onPlay,
    onAddToWatchlist,
    watchlistIds = new Set(),
    onLoadMore,
    hasMore = false,
    cardSize = 'md'
}) {
    const [isHovered, setIsHovered] = useState(false);

    const {
        containerRef,
        canScrollLeft,
        canScrollRight,
        scrollLeft,
        scrollRight
    } = useHorizontalScroll(
        hasMore ? onLoadMore : undefined,
        { threshold: 200 }
    );

    return (
        <section
            className="relative py-4"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Row Title */}
            {title && (
                <div className="container-fluid mb-4">
                    <h2 className="heading-md text-white">
                        {title}
                    </h2>
                </div>
            )}

            {/* Scrollable Row */}
            <div className="relative group">
                {/* Left Arrow */}
                <motion.button
                    className={clsx(
                        'absolute left-2 top-1/2 -translate-y-1/2 z-20',
                        'w-12 h-12 rounded-full',
                        'bg-black/60 backdrop-blur-md',
                        'flex items-center justify-center',
                        'text-white hover:bg-black/80',
                        'transition-all duration-200',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50'
                    )}
                    onClick={scrollLeft}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{
                        opacity: canScrollLeft && isHovered ? 1 : 0,
                        x: canScrollLeft && isHovered ? 0 : -10
                    }}
                    aria-label="Scroll left"
                    disabled={!canScrollLeft}
                >
                    <ChevronLeft />
                </motion.button>

                {/* Movies Container */}
                <div
                    ref={containerRef}
                    className="row-scroll px-6 lg:px-10"
                >
                    {/* Loading skeletons */}
                    {isLoading && movies.length === 0 && (
                        <>
                            {Array.from({ length: 8 }).map((_, i) => (
                                <MovieCardSkeleton key={`skeleton-${i}`} size={cardSize} />
                            ))}
                        </>
                    )}

                    {/* Movie cards */}
                    {movies.map((movie, index) => (
                        <MovieCard
                            key={movie.id}
                            movie={movie}
                            onClick={onMovieClick}
                            onPlay={onPlay}
                            onAddToWatchlist={onAddToWatchlist}
                            isInWatchlist={watchlistIds.has(movie.id)}
                            size={cardSize}
                            priority={index < 5}
                            layoutId={`movie-${movie.id}`}
                        />
                    ))}

                    {/* Loading more indicator */}
                    {isLoading && movies.length > 0 && (
                        <>
                            {Array.from({ length: 3 }).map((_, i) => (
                                <MovieCardSkeleton key={`loading-${i}`} size={cardSize} />
                            ))}
                        </>
                    )}
                </div>

                {/* Right Arrow */}
                <motion.button
                    className={clsx(
                        'absolute right-2 top-1/2 -translate-y-1/2 z-20',
                        'w-12 h-12 rounded-full',
                        'bg-black/60 backdrop-blur-md',
                        'flex items-center justify-center',
                        'text-white hover:bg-black/80',
                        'transition-all duration-200',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50'
                    )}
                    onClick={scrollRight}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{
                        opacity: canScrollRight && isHovered ? 1 : 0,
                        x: canScrollRight && isHovered ? 0 : 10
                    }}
                    aria-label="Scroll right"
                    disabled={!canScrollRight}
                >
                    <ChevronRight />
                </motion.button>

                {/* Gradient fade edges */}
                <div className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-black to-transparent pointer-events-none z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-black to-transparent pointer-events-none z-10" />
            </div>
        </section>
    );
}

// Skeleton loading state for entire row
export function MovieRowSkeleton({ title, count = 8, cardSize = 'md' }) {
    return (
        <section className="py-4">
            {title ? (
                <div className="container-fluid mb-4">
                    <div className="h-7 w-48 skeleton rounded" />
                </div>
            ) : (
                <div className="container-fluid mb-4">
                    <div className="h-7 w-48 skeleton rounded" />
                </div>
            )}
            <div className="row-scroll px-6 lg:px-10">
                {Array.from({ length: count }).map((_, i) => (
                    <MovieCardSkeleton key={i} size={cardSize} />
                ))}
            </div>
        </section>
    );
}
