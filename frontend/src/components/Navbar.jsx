'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useAuth } from '@/contexts/AuthContext';

const SearchIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-[18px] h-[18px]" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);

const UserIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[26px] h-[26px]">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const LogoutIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M7.5 3.75A1.5 1.5 0 006 5.25v13.5a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5V15a.75.75 0 011.5 0v3.75a3 3 0 01-3 3h-6a3 3 0 01-3-3V5.25a3 3 0 013-3h6a3 3 0 013 3V9A.75.75 0 0115 9V5.25a1.5 1.5 0 00-1.5-1.5h-6zm10.72 4.72a.75.75 0 011.06 0l3 3a.75.75 0 010 1.06l-3 3a.75.75 0 11-1.06-1.06l1.72-1.72H9a.75.75 0 010-1.5h10.94l-1.72-1.72a.75.75 0 010-1.06z" clipRule="evenodd" />
    </svg>
);

const Logo = () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="white" fillOpacity="0.15" />
        <polygon points="12,9 25,16 12,23" fill="white" />
    </svg>
);

const HomeIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.5z" />
    </svg>
);

// `match` lets detail pages light up their section: /movie/603-the-matrix → Movies, /tv/1396-… → Shows.
const NAV_LINKS = [
    { href: '/', label: 'Home', match: (p) => p === '/' },
    { href: '/movies', label: 'Movies', match: (p) => p.startsWith('/movies') || p.startsWith('/movie/') },
    { href: '/tv', label: 'Shows', match: (p) => p === '/tv' || p.startsWith('/tv/') },
    { href: '/watchlist', label: 'My List', match: (p) => p.startsWith('/watchlist') },
];

export default function Navbar() {
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);
    const router = useRouter();
    const pathname = usePathname() || '/';
    const { user, isAuthenticated, isLoading, logout } = useAuth();

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
        };
        const handleKey = (e) => { if (e.key === 'Escape') setUserMenuOpen(false); };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKey);
        };
    }, []);

    const handleLogout = async () => {
        await logout();
        setUserMenuOpen(false);
        router.push('/');
    };

    // The player owns its own chrome, so no site nav over the video.
    if (pathname === '/watch') return null;

    const searchActive = pathname.startsWith('/search');

    return (
        <header className="fixed top-0 left-0 right-0 z-[110] hidden md:flex items-center justify-between h-[88px] px-6 lg:px-10 pointer-events-none bg-gradient-to-b from-black/70 via-black/25 to-transparent">
            <Link href="/" className="pointer-events-auto flex items-center gap-2.5 select-none rounded-xl" aria-label="One Stop home">
                <Logo />
                <span className="text-[20px] font-bold text-white leading-none tracking-tight">
                    one<span className="font-light opacity-70">Stop</span>
                </span>
            </Link>

            {/* Glass pill: the blur keeps links legible over any hero backdrop */}
            <nav
                aria-label="Main"
                className="pointer-events-auto flex items-center gap-1 p-1.5 rounded-full bg-black/45 backdrop-blur-xl backdrop-saturate-150 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
            >
                {NAV_LINKS.map((l) => {
                    const active = l.match(pathname);
                    return (
                        <Link
                            key={l.href}
                            href={l.href}
                            aria-current={active ? 'page' : undefined}
                            className={clsx(
                                'relative inline-flex items-center gap-2 h-10 px-4 rounded-full text-[14px] font-semibold transition-colors duration-200',
                                active ? 'text-black' : 'text-white/75 hover:text-white hover:bg-white/10'
                            )}
                        >
                            {active && (
                                <motion.span
                                    layoutId="nav-active-pill"
                                    className="absolute inset-0 rounded-full bg-white"
                                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                                />
                            )}
                            <span className="relative flex items-center gap-2">
                                {active && l.href === '/' && <HomeIcon />}
                                {l.label}
                            </span>
                        </Link>
                    );
                })}

                <span className="w-px h-5 mx-1.5 bg-white/15" aria-hidden="true" />

                <Link
                    href="/search"
                    aria-label="Search"
                    aria-current={searchActive ? 'page' : undefined}
                    className={clsx(
                        'inline-flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-200',
                        searchActive ? 'bg-white text-black' : 'text-white/75 hover:text-white hover:bg-white/10'
                    )}
                >
                    <SearchIcon />
                </Link>

                {isLoading ? (
                    <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
                ) : isAuthenticated ? (
                    <div className="relative" ref={userMenuRef}>
                        <button
                            type="button"
                            onClick={() => setUserMenuOpen((v) => !v)}
                            className={clsx(
                                'flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-200',
                                userMenuOpen ? 'bg-white/15' : 'hover:bg-white/10'
                            )}
                            aria-label="Account"
                            aria-haspopup="menu"
                            aria-expanded={userMenuOpen}
                        >
                            {user?.name ? (
                                <span className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-white font-bold text-[13px]">
                                    {user.name.charAt(0).toUpperCase()}
                                </span>
                            ) : (
                                <span className="text-white/75"><UserIcon /></span>
                            )}
                        </button>

                        <AnimatePresence>
                            {userMenuOpen && (
                                <motion.div
                                    role="menu"
                                    className="absolute right-0 top-full mt-3 w-60 rounded-2xl overflow-hidden bg-[#121212]/90 backdrop-blur-xl border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.6)] origin-top-right"
                                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                                    transition={{ duration: 0.15, ease: 'easeOut' }}
                                >
                                    <div className="px-4 py-3 border-b border-white/10">
                                        <p className="text-white font-semibold truncate">{user?.name || 'User'}</p>
                                        <p className="text-white/60 text-sm truncate">{user?.email}</p>
                                    </div>
                                    <div className="p-1.5">
                                        <Link
                                            href="/watchlist"
                                            role="menuitem"
                                            className="block px-3 py-2.5 rounded-xl text-[14px] text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                                            onClick={() => setUserMenuOpen(false)}
                                        >
                                            My List
                                        </Link>
                                        <button
                                            role="menuitem"
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[14px] text-red-400 hover:text-red-300 hover:bg-white/10 transition-colors"
                                        >
                                            <LogoutIcon /> Sign out
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ) : (
                    <Link
                        href="/login"
                        className="ml-0.5 inline-flex items-center h-10 px-4 rounded-full text-[14px] font-semibold text-white border border-white/25 hover:bg-white/10 transition-colors"
                    >
                        Sign in
                    </Link>
                )}
            </nav>
        </header>
    );
}
