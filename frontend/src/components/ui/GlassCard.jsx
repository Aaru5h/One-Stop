'use client';

import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

/**
 * GlassCard - A refractive glass container component
 * Implements the iOS 26 Liquid Glass philosophy with mouse-follow gradient
 */
export default function GlassCard({
    children,
    className = '',
    variant = 'default', // 'default' | 'light' | 'heavy' | 'interactive'
    hoverScale = 1.02,
    onClick,
    as = 'div',
    enableMouseFollow = true,
    ...props
}) {
    const cardRef = useRef(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = (e) => {
        if (!cardRef.current || !enableMouseFollow) return;

        const rect = cardRef.current.getBoundingClientRect();
        setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    const glassVariants = {
        default: 'glass',
        light: 'glass-light',
        heavy: 'glass-heavy',
        interactive: 'glass-interactive'
    };

    const MotionComponent = motion[as] || motion.div;

    return (
        <MotionComponent
            ref={cardRef}
            className={clsx(
                'relative overflow-hidden',
                glassVariants[variant],
                'rounded-2xl',
                onClick && 'cursor-pointer',
                className
            )}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onClick}
            whileHover={onClick ? { scale: hoverScale } : undefined}
            whileTap={onClick ? { scale: 0.98 } : undefined}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            {...props}
        >
            {/* Mouse follow gradient effect */}
            {enableMouseFollow && (
                <div
                    className="absolute pointer-events-none transition-opacity duration-300"
                    style={{
                        width: '400px',
                        height: '400px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)',
                        left: mousePosition.x - 200,
                        top: mousePosition.y - 200,
                        opacity: isHovered ? 1 : 0
                    }}
                />
            )}

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </MotionComponent>
    );
}

// Preset variants for common use cases
export function GlassPanel({ children, className, ...props }) {
    return (
        <GlassCard
            variant="default"
            className={clsx('p-6', className)}
            enableMouseFollow={false}
            {...props}
        >
            {children}
        </GlassCard>
    );
}

export function GlassModal({ children, className, ...props }) {
    return (
        <GlassCard
            variant="heavy"
            className={clsx('p-8', className)}
            {...props}
        >
            {children}
        </GlassCard>
    );
}
