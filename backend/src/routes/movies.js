import express from 'express';
import Fuse from 'fuse.js';
import tmdbService from '../services/tmdb.js';
import { optionalAuth } from '../middleware/auth.js';
import Library from '../models/Library.js';

const router = express.Router();

// Helper to get user library if authenticated
const getUserLibrary = async (userId) => {
  if (!userId) return null;
  return await Library.findOne({ userId });
};

// @route   GET /api/movies/trending
// @desc    Get trending movies
// @access  Public
router.get('/trending', optionalAuth, async (req, res) => {
  try {
    const { page = 1, mediaType = 'movie', timeWindow = 'week' } = req.query;
    const userLibrary = await getUserLibrary(req.user?._id);
    
    const data = await tmdbService.getTrending(
      mediaType, 
      timeWindow, 
      parseInt(page)
    );

    // Stitch user data if available
    if (userLibrary) {
      data.results = data.results.map(movie => ({
        ...movie,
        isInWatchlist: userLibrary.isInWatchlist(movie.id),
        watchProgress: userLibrary.getProgress(movie.id)
      }));
    }

    res.json(data);
  } catch (error) {
    console.error('Trending error:', error);
    res.status(500).json({ error: 'Failed to fetch trending content' });
  }
});

// @route   GET /api/movies/popular
// @desc    Get popular movies
// @access  Public
router.get('/popular', optionalAuth, async (req, res) => {
  try {
    const { page = 1, mediaType = 'movie' } = req.query;
    const userLibrary = await getUserLibrary(req.user?._id);
    
    const data = await tmdbService.getPopular(mediaType, parseInt(page));

    if (userLibrary) {
      data.results = data.results.map(movie => ({
        ...movie,
        isInWatchlist: userLibrary.isInWatchlist(movie.id),
        watchProgress: userLibrary.getProgress(movie.id)
      }));
    }

    res.json(data);
  } catch (error) {
    console.error('Popular error:', error);
    res.status(500).json({ error: 'Failed to fetch popular content' });
  }
});

// @route   GET /api/movies/top-rated
// @desc    Get top rated movies
// @access  Public
router.get('/top-rated', optionalAuth, async (req, res) => {
  try {
    const { page = 1, mediaType = 'movie' } = req.query;
    const userLibrary = await getUserLibrary(req.user?._id);
    
    const data = await tmdbService.getTopRated(mediaType, parseInt(page));

    if (userLibrary) {
      data.results = data.results.map(movie => ({
        ...movie,
        isInWatchlist: userLibrary.isInWatchlist(movie.id),
        watchProgress: userLibrary.getProgress(movie.id)
      }));
    }

    res.json(data);
  } catch (error) {
    console.error('Top rated error:', error);
    res.status(500).json({ error: 'Failed to fetch top rated content' });
  }
});

// @route   GET /api/movies/now-playing
// @desc    Get now playing movies
// @access  Public
router.get('/now-playing', optionalAuth, async (req, res) => {
  try {
    const { page = 1, mediaType = 'movie' } = req.query;
    const userLibrary = await getUserLibrary(req.user?._id);
    
    const data = await tmdbService.getNowPlaying(mediaType, parseInt(page));

    if (userLibrary) {
      data.results = data.results.map(movie => ({
        ...movie,
        isInWatchlist: userLibrary.isInWatchlist(movie.id),
        watchProgress: userLibrary.getProgress(movie.id)
      }));
    }

    res.json(data);
  } catch (error) {
    console.error('Now playing error:', error);
    res.status(500).json({ error: 'Failed to fetch now playing content' });
  }
});

// @route   GET /api/movies/genre/:genreId
// @desc    Get movies by genre
// @access  Public
router.get('/genre/:genreId', optionalAuth, async (req, res) => {
  try {
    const { genreId } = req.params;
    const { page = 1, mediaType = 'movie' } = req.query;
    const userLibrary = await getUserLibrary(req.user?._id);
    
    const data = await tmdbService.getByGenre(
      parseInt(genreId), 
      mediaType, 
      parseInt(page)
    );

    if (userLibrary) {
      data.results = data.results.map(movie => ({
        ...movie,
        isInWatchlist: userLibrary.isInWatchlist(movie.id),
        watchProgress: userLibrary.getProgress(movie.id)
      }));
    }

    res.json(data);
  } catch (error) {
    console.error('Genre error:', error);
    res.status(500).json({ error: 'Failed to fetch genre content' });
  }
});

// @route   GET /api/movies/genres
// @desc    Get list of genres
// @access  Public
router.get('/genres', async (req, res) => {
  try {
    const { mediaType = 'movie' } = req.query;
    const genres = await tmdbService.getGenres(mediaType);
    res.json({ genres });
  } catch (error) {
    console.error('Genres list error:', error);
    res.status(500).json({ error: 'Failed to fetch genres' });
  }
});

// @route   GET /api/movies/:id
// @desc    Get movie details
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { mediaType = 'movie' } = req.query;
    const userLibrary = await getUserLibrary(req.user?._id);
    
    const data = await tmdbService.getDetails(
      parseInt(id), 
      mediaType,
      userLibrary
    );

    res.json(data);
  } catch (error) {
    console.error('Movie details error:', error);
    res.status(500).json({ error: 'Failed to fetch movie details' });
  }
});

// @route   GET /api/movies/:id/similar
// @desc    Get similar movies
// @access  Public
router.get('/:id/similar', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, mediaType = 'movie' } = req.query;
    
    const data = await tmdbService.getSimilar(
      parseInt(id), 
      mediaType, 
      parseInt(page)
    );

    res.json(data);
  } catch (error) {
    console.error('Similar movies error:', error);
    res.status(500).json({ error: 'Failed to fetch similar content' });
  }
});

// @route   GET /api/movies/:id/recommendations
// @desc    Get movie recommendations
// @access  Public
router.get('/:id/recommendations', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, mediaType = 'movie' } = req.query;
    
    const data = await tmdbService.getRecommendations(
      parseInt(id), 
      mediaType, 
      parseInt(page)
    );

    res.json(data);
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// @route   GET /api/movies/:id/videos
// @desc    Get movie/show videos (trailers, clips)
// @access  Public
router.get('/:id/videos', async (req, res) => {
  try {
    const { id } = req.params;
    const { mediaType = 'movie' } = req.query;
    
    const data = await tmdbService.getVideos(parseInt(id), mediaType);
    res.json(data);
  } catch (error) {
    console.error('Videos error:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// @route   GET /api/movies/:id/season/:seasonNumber
// @desc    Get season details with episode list for a TV show
// @access  Public
router.get('/:id/season/:seasonNumber', async (req, res) => {
  try {
    const { id, seasonNumber } = req.params;
    
    const data = await tmdbService.getSeasonDetails(
      parseInt(id), 
      parseInt(seasonNumber)
    );
    res.json(data);
  } catch (error) {
    console.error('Season details error:', error);
    res.status(500).json({ error: 'Failed to fetch season details' });
  }
});

export default router;
