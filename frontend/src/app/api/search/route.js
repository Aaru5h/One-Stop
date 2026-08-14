import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/middleware/auth';
import dbConnect from '@/lib/db/connect';
import Library from '@/lib/models/Library';
import tmdbService from '@/lib/services/tmdb';
import { rateLimitGuard } from '@/lib/middleware/rateLimit';
import Fuse from 'fuse.js';

// Cache for fuzzy search
let searchCache = {
  data: [],
  lastUpdated: null
};

// Update cache every 6 hours
const CACHE_DURATION = 6 * 60 * 60 * 1000;

// Build search cache from popular content
const buildSearchCache = async () => {
  try {
    const [trending, popular, topRated] = await Promise.all([
      tmdbService.getTrending('movie', 'week', 1),
      tmdbService.getPopular('movie', 1),
      tmdbService.getTopRated('movie', 1)
    ]);

    const allMovies = [
      ...trending.results,
      ...popular.results,
      ...topRated.results
    ];

    // Deduplicate by ID
    const uniqueMovies = Array.from(
      new Map(allMovies.map(m => [m.id, m])).values()
    );

    searchCache = {
      data: uniqueMovies,
      lastUpdated: Date.now()
    };

    console.log(`✓ Search cache built with ${uniqueMovies.length} items`);
  } catch (error) {
    console.error('Failed to build search cache:', error);
  }
};

export async function GET(request) {
  // Rate limit: 60 search requests per minute per IP
  const rateLimitResponse = rateLimitGuard(request, { limit: 60, windowMs: 60 * 1000, prefix: 'search' });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await dbConnect();
    const user = await getSessionUser(request);

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '20';
    const mediaType = searchParams.get('mediaType') || 'multi';
    const fuzzy = searchParams.get('fuzzy') || 'false';

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 50);

    // Use TMDB search for accurate results
    const tmdbResults = await tmdbService.search(
      query.trim(), 
      pageNum, 
      mediaType
    );

    // If fuzzy search enabled and cache is fresh, enhance with local fuzzy
    if (fuzzy === 'true') {
      // Refresh cache if stale or empty
      if (!searchCache.lastUpdated || 
          Date.now() - searchCache.lastUpdated > CACHE_DURATION) {
        await buildSearchCache();
      }

      if (searchCache.data.length > 0) {
        // Configure Fuse for fuzzy matching
        const fuse = new Fuse(searchCache.data, {
          keys: ['title', 'originalTitle', 'overview'],
          threshold: 0.4,
          distance: 100,
          includeScore: true
        });

        const fuzzyResults = fuse.search(query.trim());
        
        // Merge and deduplicate results
        const tmdbIds = new Set(tmdbResults.results.map(m => m.id));
        const additionalResults = fuzzyResults
          .filter(r => !tmdbIds.has(r.item.id))
          .map(r => r.item)
          .slice(0, 5);

        tmdbResults.results = [
          ...tmdbResults.results,
          ...additionalResults
        ].slice(0, limitNum);
      }
    }

    return NextResponse.json({
      query: query.trim(),
      results: tmdbResults.results.slice(0, limitNum),
      page: pageNum,
      totalPages: tmdbResults.totalPages,
      totalResults: tmdbResults.totalResults
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
