'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import clsx from 'clsx';

/**
 * MovieCard - Individual movie poster card with glass overlay
 * Supports lazy loading with blur-up placeholder and shared layout animations
 */
export default function MovieCard({
    movie,
    onClick,
    onPlay,
    onAddToWatchlist,
    isInWatchlist = false,
    priority = false,
    layoutId,
    size = 'md', // 'sm' | 'md' | 'lg'
    showInfo = true
}) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // Size variants
    const sizeClasses = {
        sm: 'w-32 min-w-[8rem]',
        md: 'w-44 min-w-[11rem]',
        lg: 'w-56 min-w-[14rem]'
    };

    // Format rating
    const rating = movie.voteAverage ? Math.round(movie.voteAverage * 10) : null;
    const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : null;

    return (
        <motion.div
            layoutId={layoutId}
            className={clsx(
                'relative flex-shrink-0 cursor-pointer',
                'group',
                sizeClasses[size]
            )}
            onClick={() => onClick?.(movie)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={{ scale: 1.05, zIndex: 10 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
            {/* Poster Container */}
            <div className="card-poster">
                {/* Blur-up placeholder */}
                {!isLoaded && (
                    <div className="absolute inset-0 skeleton" />
                )}

                {/* Poster Image */}
                {movie.posterPath ? (
                    <Image
                        src={movie.posterPath}
                        alt={movie.title}
                        fill
                        sizes="(max-width: 640px) 128px, (max-width: 768px) 176px, 224px"
                        className={clsx(
                            'object-cover transition-opacity duration-500',
                            isLoaded ? 'opacity-100' : 'opacity-0'
                        )}
                        onLoad={() => setIsLoaded(true)}
                        priority={priority}
                    />
                ) : (
                    <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center">
                        <span className="text-white/30 text-4xl">🎬</span>
                    </div>
                )}

                {/* Hover Overlay */}
                {showInfo && (
                    <motion.div
                        className="card-poster-overlay flex flex-col justify-end p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isHovered ? 1 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* Rating badge */}
                        {rating && (
                            <div className="absolute top-3 right-3">
                                <span className={clsx(
                                    'px-2 py-1 rounded text-xs font-bold',
                                    rating >= 70 ? 'bg-green-500/90' :
                                        rating >= 50 ? 'bg-yellow-500/90' : 'bg-red-500/90',
                                    'text-white'
                                )}>
                                    {rating}%
                                </span>
                            </div>
                        )}

                        {/* Title and year */}
                        <div>
                            <h3 className="text-white font-semibold text-sm line-clamp-2 mb-1">
                                {movie.title}
                            </h3>
                            {year && (
                                <span className="text-white/60 text-xs">{year}</span>
                            )}
                        </div>

                        {/* Quick actions */}
                        <div className="flex gap-2 mt-3">
                            <button
                                className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black hover:bg-white/90 transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onPlay?.(movie);
                                }}
                                aria-label="Play"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                                </svg>
                            </button>
                            <button
                                className={clsx(
                                    'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                                    isInWatchlist
                                        ? 'bg-green-500 text-white hover:bg-green-600'
                                        : 'bg-white/20 text-white hover:bg-white/30'
                                )}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAddToWatchlist?.(movie);
                                }}
                                aria-label={isInWatchlist ? "In watchlist" : "Add to watchlist"}
                            >
                                {isInWatchlist ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                        <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                        <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Progress bar for continue watching */}
                {movie.watchProgress > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                        <div
                            className="h-full bg-red-500"
                            style={{ width: `${movie.watchProgress}%` }}
                        />
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// Skeleton variant for loading states
export function MovieCardSkeleton({ size = 'md' }) {
    const sizeClasses = {
        sm: 'w-32 min-w-[8rem]',
        md: 'w-44 min-w-[11rem]',
        lg: 'w-56 min-w-[14rem]'
    };

    return (
        <div className={clsx('flex-shrink-0', sizeClasses[size])}>
            <div className="aspect-[2/3] rounded-2xl skeleton" />
        </div>
    );
}
