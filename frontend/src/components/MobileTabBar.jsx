'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useScrollDirection } from '@/hooks/useInfiniteScroll';

// Icons
const HomeIcon = ({ active }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
);

const SearchIcon = ({ active }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);

const BookmarkIcon = ({ active }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
    </svg>
);

const UserIcon = ({ active }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
);

const tabs = [
    { id: 'home', href: '/', icon: HomeIcon, label: 'Home' },
    { id: 'search', href: '/search', icon: SearchIcon, label: 'Search' },
    { id: 'watchlist', href: '/watchlist', icon: BookmarkIcon, label: 'Watchlist' },
    { id: 'profile', href: '/profile', icon: UserIcon, label: 'Profile' }
];

/**
 * MobileTabBar - Bottom navigation for mobile with expand/collapse on scroll
 */
export default function MobileTabBar({ activeTab = 'home' }) {
    const { scrollDirection } = useScrollDirection();
    const isCollapsed = scrollDirection === 'down';

    return (
        <motion.div
            className={clsx(
                'mobile-tab-bar',
                'glass-heavy',
                isCollapsed && 'collapsed'
            )}
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
            <AnimatePresence mode="wait">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;

                    return (
                        <Link
                            key={tab.id}
                            href={tab.href}
                            className={clsx(
                                'relative flex items-center justify-center',
                                'rounded-2xl transition-all duration-200',
                                isCollapsed ? 'w-12 h-12' : 'px-5 h-12',
                                isActive
                                    ? 'bg-white/15 text-white'
                                    : 'text-white/50 hover:text-white hover:bg-white/5'
                            )}
                        >
                            <Icon active={isActive} />

                            {/* Label - hidden when collapsed */}
                            <AnimatePresence>
                                {!isCollapsed && isActive && (
                                    <motion.span
                                        className="ml-2 text-sm font-medium"
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: 'auto' }}
                                        exit={{ opacity: 0, width: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {tab.label}
                                    </motion.span>
                                )}
                            </AnimatePresence>

                            {/* Active indicator dot */}
                            {isActive && isCollapsed && (
                                <motion.div
                                    className="absolute -bottom-1 w-1 h-1 rounded-full bg-white"
                                    layoutId="tabIndicator"
                                />
                            )}
                        </Link>
                    );
                })}
            </AnimatePresence>
        </motion.div>
    );
}
