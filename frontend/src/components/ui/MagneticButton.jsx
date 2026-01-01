'use client';

import { useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import clsx from 'clsx';

/**
 * MagneticButton - Interactive button that follows cursor with magnetic pull
 * Used for Play/Watchlist buttons
 */
export default function MagneticButton({
    children,
    className = '',
    variant = 'primary', // 'primary' | 'glass' | 'ghost'
    size = 'md', // 'sm' | 'md' | 'lg'
    magneticStrength = 0.3,
    onClick,
    disabled = false,
    icon,
    ...props
}) {
    const buttonRef = useRef(null);
    const [isHovered, setIsHovered] = useState(false);

    // Spring physics for smooth magnetic effect
    const springConfig = { stiffness: 150, damping: 15, mass: 0.1 };
    const x = useSpring(0, springConfig);
    const y = useSpring(0, springConfig);

    const handleMouseMove = (e) => {
        if (!buttonRef.current || disabled) return;

        const rect = buttonRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const deltaX = (e.clientX - centerX) * magneticStrength;
        const deltaY = (e.clientY - centerY) * magneticStrength;

        x.set(deltaX);
        y.set(deltaY);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
        setIsHovered(false);
    };

    const sizeClasses = {
        sm: 'h-10 px-4 text-sm gap-1.5',
        md: 'h-12 px-6 text-base gap-2',
        lg: 'h-14 px-8 text-lg gap-2.5'
    };

    const variantClasses = {
        primary: clsx(
            'bg-white text-black',
            'hover:bg-white/90',
            'shadow-lg shadow-white/10'
        ),
        glass: clsx(
            'bg-white/10 text-white',
            'backdrop-blur-xl',
            'border border-white/20',
            'hover:bg-white/15 hover:border-white/30'
        ),
        ghost: clsx(
            'bg-transparent text-white/80',
            'hover:text-white hover:bg-white/5'
        )
    };

    return (
        <motion.button
            ref={buttonRef}
            className={clsx(
                'relative inline-flex items-center justify-center',
                'font-semibold rounded-full',
                'transition-colors duration-200',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                sizeClasses[size],
                variantClasses[variant],
                className
            )}
            style={{ x, y }}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            disabled={disabled}
            whileTap={{ scale: 0.96 }}
            {...props}
        >
            {/* Glow effect on hover */}
            {variant === 'primary' && (
                <motion.div
                    className="absolute inset-0 rounded-full bg-white"
                    initial={{ opacity: 0 }}
                    animate={{
                        opacity: isHovered ? 0.2 : 0,
                        scale: isHovered ? 1.1 : 1
                    }}
                    transition={{ duration: 0.3 }}
                    style={{ filter: 'blur(20px)' }}
                />
            )}

            {/* Content */}
            <span className="relative flex items-center gap-2">
                {icon && <span className="flex-shrink-0">{icon}</span>}
                {children}
            </span>
        </motion.button>
    );
}

/**
 * IconButton - Circular magnetic button for icons only
 */
export function MagneticIconButton({
    children,
    className = '',
    variant = 'glass',
    size = 'md',
    onClick,
    label,
    ...props
}) {
    const sizeClasses = {
        sm: 'w-9 h-9',
        md: 'w-11 h-11',
        lg: 'w-14 h-14'
    };

    return (
        <MagneticButton
            className={clsx(
                '!p-0 !rounded-full',
                sizeClasses[size],
                className
            )}
            variant={variant}
            onClick={onClick}
            aria-label={label}
            {...props}
        >
            {children}
        </MagneticButton>
    );
}
