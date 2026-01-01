'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import clsx from 'clsx';

/**
 * TextPressure - React Bits inspired variable font weight effect
 * Font weight changes based on mouse proximity to each character
 */
export default function TextPressure({
    text,
    className = '',
    as = 'h1',
    minWeight = 100,
    maxWeight = 900,
    effectRadius = 150,
    enableEffect = true,
    noWrap = false
}) {
    const containerRef = useRef(null);
    const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
    const [charRects, setCharRects] = useState([]);
    const [isMounted, setIsMounted] = useState(false);

    // Pre-compute word/character structure with stable indices
    const wordData = useMemo(() => {
        const words = text.split(' ');
        let globalIndex = 0;
        return words.map((word, wordIndex) => ({
            word,
            wordIndex,
            chars: word.split('').map((char) => ({
                char,
                globalIndex: globalIndex++
            }))
        }));
    }, [text]);

    // Mark as mounted for client-only effects
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Update character positions
    useEffect(() => {
        if (!containerRef.current || !enableEffect || !isMounted) return;

        const updateCharRects = () => {
            const chars = containerRef.current.querySelectorAll('.text-pressure-char');
            const rects = Array.from(chars).map(char => {
                const rect = char.getBoundingClientRect();
                return {
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2
                };
            });
            setCharRects(rects);
        };

        updateCharRects();
        window.addEventListener('resize', updateCharRects);
        return () => window.removeEventListener('resize', updateCharRects);
    }, [text, enableEffect, isMounted]);

    // Track mouse position
    useEffect(() => {
        if (!enableEffect || !isMounted) return;

        const handleMouseMove = (e) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [enableEffect, isMounted]);

    // Calculate weight for each character based on distance from mouse
    const getCharWeight = (charIndex) => {
        // Return default weight on server or before mount
        const defaultWeight = minWeight + (maxWeight - minWeight) / 2;
        if (!isMounted || !enableEffect || charRects.length <= charIndex) return defaultWeight;

        const charPos = charRects[charIndex];
        if (!charPos) return defaultWeight;

        const distance = Math.sqrt(
            Math.pow(mousePos.x - charPos.x, 2) +
            Math.pow(mousePos.y - charPos.y, 2)
        );

        // Normalize distance to weight
        const normalizedDistance = Math.min(distance / effectRadius, 1);
        const weight = maxWeight - normalizedDistance * (maxWeight - minWeight);

        return Math.round(weight);
    };

    const Tag = motion[as] || motion.h1;
    const defaultWeight = minWeight + (maxWeight - minWeight) / 2;

    return (
        <Tag
            ref={containerRef}
            className={clsx(
                noWrap ? 'whitespace-nowrap' : '',
                className
            )}
            style={{
                fontVariationSettings: `"wght" ${defaultWeight}`
            }}
        >
            {wordData.map(({ word, wordIndex, chars }) => (
                <span key={`word-${wordIndex}`} className="inline-block whitespace-nowrap">
                    {chars.map(({ char, globalIndex }) => (
                        <span
                            key={`char-${globalIndex}`}
                            className="text-pressure-char inline-block"
                            style={{
                                fontWeight: isMounted ? getCharWeight(globalIndex) : defaultWeight,
                                transition: 'font-weight 0.1s ease-out'
                            }}
                        >
                            {char}
                        </span>
                    ))}
                    {/* Add space after word except for last word */}
                    {wordIndex < wordData.length - 1 && (
                        <span className="inline-block">&nbsp;</span>
                    )}
                </span>
            ))}
        </Tag>
    );
}

/**
 * AnimatedTitle - Simple animated title with staggered character reveal
 */
export function AnimatedTitle({
    text,
    className = '',
    as = 'h1',
    delay = 0
}) {
    const characters = text.split('');
    const Tag = motion[as] || motion.h1;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.03,
                delayChildren: delay
            }
        }
    };

    const charVariants = {
        hidden: {
            opacity: 0,
            y: 20,
            rotateX: -90
        },
        visible: {
            opacity: 1,
            y: 0,
            rotateX: 0,
            transition: {
                type: 'spring',
                stiffness: 200,
                damping: 20
            }
        }
    };

    return (
        <Tag
            className={clsx('inline-flex flex-wrap', className)}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {characters.map((char, index) => (
                <motion.span
                    key={`${char}-${index}`}
                    variants={charVariants}
                    style={{ display: 'inline-block' }}
                >
                    {char === ' ' ? '\u00A0' : char}
                </motion.span>
            ))}
        </Tag>
    );
}
