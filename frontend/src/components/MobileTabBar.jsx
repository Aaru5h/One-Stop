'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const HomeIcon = ({ active }) => (
    <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.5} className="w-[22px] h-[22px]">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
);

const MoviesIcon = ({ active }) => (
    <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.5} className="w-[22px] h-[22px]">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25M3.375 4.5h17.25M6 4.5v15M9 4.5v15M12 4.5v15M15 4.5v15M18 4.5v15" />
    </svg>
);

const TvIcon = ({ active }) => (
    <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.5} className="w-[22px] h-[22px]">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12M3 15.75V6a1.5 1.5 0 011.5-1.5h15A1.5 1.5 0 0121 6v9.75a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 15.75z" />
    </svg>
);

const BookmarkIcon = ({ active }) => (
    <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.5} className="w-[22px] h-[22px]">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
    </svg>
);

const SearchIcon = ({ active }) => (
    <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.5} className="w-[22px] h-[22px]">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);

const TABS = [
    { href: '/', icon: HomeIcon, label: 'Home' },
    { href: '/movies', icon: MoviesIcon, label: 'Movies' },
    { href: '/tv', icon: TvIcon, label: 'TV' },
    { href: '/watchlist', icon: BookmarkIcon, label: 'Watchlist' },
    { href: '/search', icon: SearchIcon, label: 'Search' },
];

const isActive = (pathname, href) => href === '/' ? pathname === '/' : pathname.startsWith(href);

export default function MobileTabBar() {
    const pathname = usePathname() || '/';

    // Would sit on top of the player's own controls.
    if (pathname === '/watch') return null;

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[120] flex justify-center pb-2 px-4 pointer-events-none">
            <div
                className="pointer-events-auto flex items-center gap-[4px] px-[6px] py-[6px] shadow-[0_8px_32px_rgba(0,0,0,0.9)]"
                style={{ background: 'var(--tile-bar-bg)', borderRadius: 22 }}
            >
                {TABS.map((tab) => {
                    const active = isActive(pathname, tab.href);
                    const Icon = tab.icon;
                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            aria-label={tab.label}
                            className="flex items-center justify-center transition-all duration-200"
                            style={{
                                width: 50,
                                height: 50,
                                borderRadius: 15,
                                background: active ? 'var(--tile-active)' : 'var(--tile-inactive)',
                            }}
                        >
                            <span className={clsx(active ? 'text-white' : 'text-white/60')}>
                                <Icon active={active} />
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
