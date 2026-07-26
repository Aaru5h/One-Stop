'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useAuth } from '@/contexts/AuthContext';

const MenuIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-[22px] h-[22px]">
        <path fillRule="evenodd" d="M3 6.75A.75.75 0 013.75 6h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 6.75zM3 12a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 12zm0 5.25a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
    </svg>
);

const SearchIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
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

const NAV_LINKS = [
    { href: '/', label: 'Home' },
    { href: '/movies', label: 'Movies' },
    { href: '/tv', label: 'TV Shows' },
    { href: '/watchlist', label: 'Watchlist' },
];

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const userMenuRef = useRef(null);
    const router = useRouter();
    const { user, isAuthenticated, isLoading, logout } = useAuth();

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await logout();
        setUserMenuOpen(false);
        router.push('/');
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-[110] hidden md:flex items-center h-[64px] px-4 md:px-6 transition-all duration-300 bg-gradient-to-b from-black/60 to-transparent backdrop-blur-[2px]">
            {/* Left: hamburger + logo */}
            <div className="flex items-center gap-3 flex-shrink-0" ref={menuRef}>
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setMenuOpen((v) => !v)}
                        className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
                        aria-label="Open menu"
                    >
                        <MenuIcon />
                    </button>

                    <AnimatePresence>
                        {menuOpen && (
                            <motion.div
                                className="absolute left-0 top-full mt-2 w-56 rounded-2xl overflow-hidden bg-[#111] border border-white/10 shadow-2xl"
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.15 }}
                            >
                                <div className="py-1">
                                    {NAV_LINKS.map((l) => (
                                        <Link
                                            key={l.href}
                                            href={l.href}
                                            onClick={() => setMenuOpen(false)}
                                            className="block px-4 py-2.5 text-[14px] font-medium text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                                        >
                                            {l.label}
                                        </Link>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <Link href="/" className="flex flex-row items-center gap-2.5 select-none">
                    <Logo />
                    <span className="text-[20px] font-bold text-white leading-none tracking-tight">
                        one<span className="font-light opacity-70">Stop</span>
                    </span>
                </Link>
            </div>

            {/* Center: search pill */}
            <div className="absolute left-1/2 -translate-x-1/2 w-[45%] max-w-[600px] min-w-[200px]">
                <Link
                    href="/search"
                    className="w-full flex items-center justify-between h-[42px] rounded-full px-5 gap-3 transition-all duration-200 border hover:bg-white/10"
                    style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' }}
                >
                    <span className="text-[14px] font-semibold text-white/70 truncate tracking-wide">
                        Search movies, shows…
                    </span>
                    <SearchIcon />
                </Link>
            </div>

            {/* Right: user */}
            <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                {isLoading ? (
                    <div className="w-9 h-9 rounded-full bg-white/10 animate-pulse" />
                ) : isAuthenticated ? (
                    <div className="relative" ref={userMenuRef}>
                        <button
                            type="button"
                            onClick={() => setUserMenuOpen((v) => !v)}
                            className={clsx(
                                'flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 overflow-hidden',
                                userMenuOpen ? 'bg-white/15' : 'hover:bg-white/10'
                            )}
                            aria-label="Profile"
                        >
                            {user?.name ? (
                                <span className="text-white/90 font-semibold text-sm">{user.name.charAt(0).toUpperCase()}</span>
                            ) : (
                                <span className="text-white/70"><UserIcon /></span>
                            )}
                        </button>

                        <AnimatePresence>
                            {userMenuOpen && (
                                <motion.div
                                    className="absolute right-0 mt-2 w-56 rounded-2xl overflow-hidden bg-[#111] border border-white/10 shadow-2xl"
                                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <div className="px-4 py-3 border-b border-white/10">
                                        <p className="text-white font-medium truncate">{user?.name || 'User'}</p>
                                        <p className="text-white/50 text-sm truncate">{user?.email}</p>
                                    </div>
                                    <div className="py-1">
                                        <Link
                                            href="/watchlist"
                                            className="block px-4 py-2.5 text-[14px] text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                                            onClick={() => setUserMenuOpen(false)}
                                        >
                                            My Watchlist
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-2 px-4 py-2.5 text-[14px] text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors"
                                        >
                                            <LogoutIcon /> Sign Out
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ) : (
                    <Link
                        href="/login"
                        className="px-4 py-2 rounded-full text-[13px] font-semibold text-black bg-white hover:bg-white/90 transition-all"
                    >
                        Sign In
                    </Link>
                )}
            </div>
        </header>
    );
}
