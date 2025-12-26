import express from 'express';
import Fuse from 'fuse.js';
import tmdbService from '../services/tmdb.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

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

// Initialize cache on startup
buildSearchCache();

// @route   GET /api/search
// @desc    Search movies and shows with fuzzy matching
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { 
      query, 
      page = 1, 
      limit = 20,
      mediaType = 'multi',
      fuzzy = 'false'
    } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Search query is required' 
      });
    }

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 50); // Max 50 per page

    // Use TMDB search for accurate results
    const tmdbResults = await tmdbService.search(
      query.trim(), 
      pageNum, 
      mediaType
    );

    // If fuzzy search enabled and cache is fresh, enhance with local fuzzy
    if (fuzzy === 'true') {
      // Refresh cache if stale
      if (!searchCache.lastUpdated || 
          Date.now() - searchCache.lastUpdated > CACHE_DURATION) {
        await buildSearchCache();
      }

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

    res.json({
      query: query.trim(),
      results: tmdbResults.results.slice(0, limitNum),
      page: pageNum,
      totalPages: tmdbResults.totalPages,
      totalResults: tmdbResults.totalResults
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// @route   GET /api/search/suggestions
// @desc    Get quick search suggestions (for autocomplete)
// @access  Public
router.get('/suggestions', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length < 2) {
      return res.json({ suggestions: [] });
    }

    // Quick search with minimal data
    const results = await tmdbService.search(query.trim(), 1, 'multi');
    
    const suggestions = results.results.slice(0, 8).map(item => ({
      id: item.id,
      title: item.title,
      mediaType: item.mediaType,
      posterPath: item.posterPath,
      releaseDate: item.releaseDate
    }));

    res.json({ suggestions });
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

export default router;
