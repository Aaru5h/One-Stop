'use client';

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import clsx from 'clsx';
import { GlassModal } from '@/components/ui/GlassCard';
import MagneticButton from '@/components/ui/MagneticButton';
import TextPressure from '@/components/ui/TextPressure';

// Icons
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
    </svg>
);

const PlayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
    </svg>
);

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
    </svg>
);

/**
 * MovieModal - Detail modal with shared layout animation
 * Displays full movie details, cast, and actions
 */
export default function MovieModal({
    movie,
    isOpen,
    onClose,
    onPlay,
    onToggleWatchlist,
    isInWatchlist = false,
    layoutId
}) {
    // Handle escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose?.();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    // Format metadata
    const rating = movie?.voteAverage ? Math.round(movie.voteAverage * 10) : null;
    const year = movie?.releaseDate ? new Date(movie.releaseDate).getFullYear() : null;
    const runtime = movie?.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : null;

    return (
        <AnimatePresence>
            {isOpen && movie && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className="fixed inset-4 md:inset-8 lg:inset-12 z-50 overflow-hidden rounded-3xl"
                        layoutId={layoutId}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                        <GlassModal className="w-full h-full overflow-hidden !p-0">
                            {/* Background Image */}
                            <div className="absolute inset-0">
                                {movie.backdropPath && (
                                    <Image
                                        src={movie.backdropPath}
                                        alt={movie.title}
                                        fill
                                        className="object-cover"
                                        quality={90}
                                    />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />
                            </div>

                            {/* Close Button */}
                            <button
                                className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                                onClick={onClose}
                                aria-label="Close"
                            >
                                <CloseIcon />
                            </button>

                            {/* Content */}
                            <div className="relative z-10 h-full overflow-y-auto">
                                <div className="min-h-full flex flex-col justify-end p-6 md:p-10">
                                    {/* Title with TextPressure */}
                                    <TextPressure
                                        text={movie.title}
                                        className="heading-xl text-white mb-4"
                                        as="h2"
                                        minWeight={400}
                                        maxWeight={700}
                                    />

                                    {/* Tagline */}
                                    {movie.tagline && (
                                        <p className="text-white/60 italic text-lg mb-4">
                                            "{movie.tagline}"
                                        </p>
                                    )}

                                    {/* Metadata */}
                                    <div className="flex flex-wrap items-center gap-4 mb-6">
                                        {rating && (
                                            <span className={clsx(
                                                'px-3 py-1 rounded-full font-bold text-sm',
                                                rating >= 70 ? 'bg-green-500/20 text-green-400' :
                                                    rating >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                                                        'bg-red-500/20 text-red-400'
                                            )}>
                                                {rating}% Match
                                            </span>
                                        )}
                                        {year && (
                                            <span className="text-white/70">{year}</span>
                                        )}
                                        {runtime && (
                                            <span className="text-white/70">{runtime}</span>
                                        )}
                                        {movie.genres?.map(genre => (
                                            <span
                                                key={genre.id}
                                                className="px-3 py-1 rounded-full bg-white/10 text-sm text-white/80"
                                            >
                                                {genre.name}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Overview */}
                                    <p className="body-lg text-white/80 max-w-3xl mb-8">
                                        {movie.overview}
                                    </p>

                                    {/* Cast */}
                                    {movie.cast && movie.cast.length > 0 && (
                                        <div className="mb-8">
                                            <h3 className="heading-md text-white mb-4">Cast</h3>
                                            <div className="flex gap-4 overflow-x-auto pb-2">
                                                {movie.cast.slice(0, 8).map(person => (
                                                    <div key={person.id} className="flex-shrink-0 text-center">
                                                        <div className="w-16 h-16 rounded-full overflow-hidden bg-white/10 mb-2">
                                                            {person.profilePath ? (
                                                                <Image
                                                                    src={person.profilePath}
                                                                    alt={person.name}
                                                                    width={64}
                                                                    height={64}
                                                                    className="object-cover w-full h-full"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-white/30 text-2xl">
                                                                    👤
                                                                </div>
                                                            )}
                                                        </div>
                                                        <p className="text-white text-sm font-medium truncate w-20">
                                                            {person.name}
                                                        </p>
                                                        <p className="text-white/50 text-xs truncate w-20">
                                                            {person.character}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Director */}
                                    {movie.director && (
                                        <p className="text-white/60 mb-8">
                                            <span className="text-white/40">Director:</span>{' '}
                                            <span className="text-white">{movie.director}</span>
                                        </p>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap gap-4">
                                        <MagneticButton
                                            variant="primary"
                                            size="lg"
                                            icon={<PlayIcon />}
                                            onClick={() => onPlay?.(movie)}
                                        >
                                            Play Now
                                        </MagneticButton>

                                        <MagneticButton
                                            variant="glass"
                                            size="lg"
                                            icon={isInWatchlist ? <CheckIcon /> : <PlusIcon />}
                                            onClick={() => onToggleWatchlist?.(movie)}
                                        >
                                            {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                                        </MagneticButton>
                                    </div>
                                </div>
                            </div>
                        </GlassModal>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
