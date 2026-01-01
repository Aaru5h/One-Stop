'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import TextPressure from '@/components/ui/TextPressure';
import MagneticButton from '@/components/ui/MagneticButton';
import GlassCard from '@/components/ui/GlassCard';

// Icons
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

const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
    </svg>
);

/**
 * Hero - Featured content hero section with full viewport background
 */
export default function Hero({
    movie,
    onPlay,
    onAddToWatchlist,
    onMoreInfo,
    isLoading = false
}) {
    if (isLoading || !movie) {
        return <HeroSkeleton />;
    }

    // Format rating as percentage
    const rating = movie.voteAverage ? Math.round(movie.voteAverage * 10) : null;

    // Get year from release date
    const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : null;

    return (
        <section className="hero">
            {/* Background Image */}
            <div className="hero-background">
                {movie.backdropPath && (
                    <Image
                        src={movie.backdropPath}
                        alt={movie.title}
                        fill
                        priority
                        quality={90}
                        className="object-cover"
                        sizes="100vw"
                    />
                )}
                <div className="hero-gradient" />
                <div className="hero-vignette" />
            </div>

            {/* Content */}
            <div className="container-fluid relative z-10">
                <motion.div
                    className="max-w-3xl"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                >
                    {/* Title with TextPressure effect */}
                    <TextPressure
                        text={movie.title}
                        className="heading-hero text-white mb-6"
                        as="h1"
                        minWeight={300}
                        maxWeight={800}
                        effectRadius={200}
                    />

                    {/* Metadata */}
                    <motion.div
                        className="flex items-center gap-4 mb-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        {rating && (
                            <span className="flex items-center gap-1.5 text-green-400 font-semibold">
                                <span className="text-lg">{rating}%</span>
                                <span className="text-sm text-white/50">Match</span>
                            </span>
                        )}
                        {year && (
                            <span className="text-white/70">{year}</span>
                        )}
                        {movie.runtime && (
                            <span className="text-white/70">{movie.runtime} min</span>
                        )}
                        {movie.genres?.slice(0, 2).map(genre => (
                            <span
                                key={genre.id || genre}
                                className="px-3 py-1 rounded-full bg-white/10 text-sm text-white/80"
                            >
                                {genre.name || genre}
                            </span>
                        ))}
                    </motion.div>

                    {/* Overview - Glass panel on hover/focus */}
                    <GlassCard
                        variant="light"
                        className="p-5 mb-8 max-w-2xl"
                        enableMouseFollow={false}
                    >
                        <p className="body-lg text-white/80 line-clamp-3">
                            {movie.overview}
                        </p>
                    </GlassCard>

                    {/* Action Buttons */}
                    <motion.div
                        className="flex items-center gap-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <MagneticButton
                            variant="primary"
                            size="lg"
                            icon={<PlayIcon />}
                            onClick={() => onPlay?.(movie)}
                        >
                            Play
                        </MagneticButton>

                        <MagneticButton
                            variant="glass"
                            size="lg"
                            icon={<PlusIcon />}
                            onClick={() => onAddToWatchlist?.(movie)}
                        >
                            Watchlist
                        </MagneticButton>

                        <MagneticButton
                            variant="ghost"
                            size="lg"
                            icon={<InfoIcon />}
                            onClick={() => onMoreInfo?.(movie)}
                        >
                            More Info
                        </MagneticButton>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}

// Skeleton loading state
function HeroSkeleton() {
    return (
        <section className="hero">
            <div className="hero-background bg-zinc-900" />
            <div className="container-fluid relative z-10">
                <div className="max-w-3xl space-y-6">
                    {/* Title skeleton */}
                    <div className="h-24 w-3/4 skeleton rounded-lg" />

                    {/* Metadata skeleton */}
                    <div className="flex gap-4">
                        <div className="h-6 w-20 skeleton rounded-full" />
                        <div className="h-6 w-16 skeleton rounded-full" />
                        <div className="h-6 w-24 skeleton rounded-full" />
                    </div>

                    {/* Overview skeleton */}
                    <div className="space-y-2">
                        <div className="h-4 w-full skeleton rounded" />
                        <div className="h-4 w-5/6 skeleton rounded" />
                        <div className="h-4 w-4/6 skeleton rounded" />
                    </div>

                    {/* Buttons skeleton */}
                    <div className="flex gap-4">
                        <div className="h-14 w-32 skeleton rounded-full" />
                        <div className="h-14 w-36 skeleton rounded-full" />
                    </div>
                </div>
            </div>
        </section>
    );
}
