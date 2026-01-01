'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * useInfiniteScroll - Hook for implementing scroll-to-load using Intersection Observer
 * @param {Function} onLoadMore - Callback when sentinel enters viewport
 * @param {Object} options - IntersectionObserver options
 */
export default function useInfiniteScroll(onLoadMore, options = {}) {
  const sentinelRef = useRef(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  const {
    threshold = 0.1,
    rootMargin = '100px',
    enabled = true
  } = options;

  const handleIntersect = useCallback((entries) => {
    const [entry] = entries;
    setIsIntersecting(entry.isIntersecting);
    
    if (entry.isIntersecting && enabled) {
      onLoadMore?.();
    }
  }, [onLoadMore, enabled]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(handleIntersect, {
      threshold,
      rootMargin
    });

    observer.observe(sentinel);

    return () => {
      observer.unobserve(sentinel);
      observer.disconnect();
    };
  }, [handleIntersect, threshold, rootMargin]);

  return {
    sentinelRef,
    isIntersecting
  };
}

/**
 * useHorizontalScroll - Hook for horizontal scrolling movie rows
 */
export function useHorizontalScroll(onReachEnd, options = {}) {
  const containerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const { threshold = 100 } = options;

  const checkScrollPosition = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - threshold);

    // Check if near right edge
    if (scrollLeft >= scrollWidth - clientWidth - threshold) {
      onReachEnd?.();
    }
  }, [onReachEnd, threshold]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Initial check
    checkScrollPosition();

    container.addEventListener('scroll', checkScrollPosition, { passive: true });
    window.addEventListener('resize', checkScrollPosition);

    return () => {
      container.removeEventListener('scroll', checkScrollPosition);
      window.removeEventListener('resize', checkScrollPosition);
    };
  }, [checkScrollPosition]);

  const scrollBy = useCallback((offset) => {
    containerRef.current?.scrollBy({
      left: offset,
      behavior: 'smooth'
    });
  }, []);

  const scrollLeft = useCallback(() => scrollBy(-400), [scrollBy]);
  const scrollRight = useCallback(() => scrollBy(400), [scrollBy]);

  return {
    containerRef,
    canScrollLeft,
    canScrollRight,
    scrollLeft,
    scrollRight
  };
}

/**
 * useScrollDirection - Detect scroll direction for mobile tab bar
 */
export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState('up');
  const [scrollY, setScrollY] = useState(0);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setScrollDirection('down');
      } else if (currentScrollY < lastScrollY.current) {
        setScrollDirection('up');
      }
      
      lastScrollY.current = currentScrollY;
      setScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return { scrollDirection, scrollY };
}
