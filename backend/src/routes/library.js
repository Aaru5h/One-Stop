import express from 'express';
import Library from '../models/Library.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All library routes require authentication
router.use(protect);

// @route   GET /api/library/watchlist
// @desc    Get user's watchlist
// @access  Private
router.get('/watchlist', async (req, res) => {
  try {
    let library = await Library.findOne({ userId: req.user._id });
    
    if (!library) {
      library = await Library.create({ userId: req.user._id });
    }

    // Sort by most recently added
    const watchlist = library.watchlist.sort(
      (a, b) => new Date(b.addedAt) - new Date(a.addedAt)
    );

    res.json({
      success: true,
      watchlist,
      count: watchlist.length
    });
  } catch (error) {
    console.error('Get watchlist error:', error);
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
});

// @route   POST /api/library/watchlist/:movieId
// @desc    Add movie to watchlist
// @access  Private
router.post('/watchlist/:movieId', async (req, res) => {
  try {
    const { movieId } = req.params;
    const { title, posterPath, mediaType = 'movie' } = req.body;

    let library = await Library.findOne({ userId: req.user._id });
    
    if (!library) {
      library = await Library.create({ userId: req.user._id });
    }

    // Check if already in watchlist
    const exists = library.watchlist.some(
      item => item.movieId === parseInt(movieId)
    );

    if (exists) {
      return res.status(400).json({ 
        error: 'Already in watchlist' 
      });
    }

    // Add to watchlist
    library.watchlist.push({
      movieId: parseInt(movieId),
      title,
      posterPath,
      mediaType,
      addedAt: new Date()
    });

    await library.save();

    res.status(201).json({
      success: true,
      message: 'Added to watchlist',
      item: library.watchlist[library.watchlist.length - 1]
    });
  } catch (error) {
    console.error('Add to watchlist error:', error);
    res.status(500).json({ error: 'Failed to add to watchlist' });
  }
});

// @route   DELETE /api/library/watchlist/:movieId
// @desc    Remove movie from watchlist
// @access  Private
router.delete('/watchlist/:movieId', async (req, res) => {
  try {
    const { movieId } = req.params;

    const library = await Library.findOne({ userId: req.user._id });
    
    if (!library) {
      return res.status(404).json({ error: 'Library not found' });
    }

    const initialLength = library.watchlist.length;
    library.watchlist = library.watchlist.filter(
      item => item.movieId !== parseInt(movieId)
    );

    if (library.watchlist.length === initialLength) {
      return res.status(404).json({ 
        error: 'Movie not in watchlist' 
      });
    }

    await library.save();

    res.json({
      success: true,
      message: 'Removed from watchlist'
    });
  } catch (error) {
    console.error('Remove from watchlist error:', error);
    res.status(500).json({ error: 'Failed to remove from watchlist' });
  }
});

// @route   GET /api/library/continue-watching
// @desc    Get continue watching list
// @access  Private
router.get('/continue-watching', async (req, res) => {
  try {
    let library = await Library.findOne({ userId: req.user._id });
    
    if (!library) {
      library = await Library.create({ userId: req.user._id });
    }

    // Sort by most recently watched, exclude completed (100%)
    const continueWatching = library.continueWatching
      .filter(item => item.progress < 95) // Hide nearly finished
      .sort((a, b) => new Date(b.lastWatched) - new Date(a.lastWatched));

    res.json({
      success: true,
      continueWatching,
      count: continueWatching.length
    });
  } catch (error) {
    console.error('Get continue watching error:', error);
    res.status(500).json({ error: 'Failed to fetch continue watching' });
  }
});

// @route   PUT /api/library/progress/:movieId
// @desc    Update watching progress
// @access  Private
router.put('/progress/:movieId', async (req, res) => {
  try {
    const { movieId } = req.params;
    const { 
      progress, 
      currentTime, 
      duration,
      title,
      posterPath,
      backdropPath,
      mediaType = 'movie'
    } = req.body;

    let library = await Library.findOne({ userId: req.user._id });
    
    if (!library) {
      library = await Library.create({ userId: req.user._id });
    }

    // Find existing entry
    const existingIndex = library.continueWatching.findIndex(
      item => item.movieId === parseInt(movieId)
    );

    const progressData = {
      movieId: parseInt(movieId),
      progress: Math.min(100, Math.max(0, progress)),
      currentTime: currentTime || 0,
      duration: duration || 0,
      title,
      posterPath,
      backdropPath,
      mediaType,
      lastWatched: new Date()
    };

    if (existingIndex > -1) {
      // Update existing
      library.continueWatching[existingIndex] = {
        ...library.continueWatching[existingIndex].toObject(),
        ...progressData
      };
    } else {
      // Add new entry
      library.continueWatching.push(progressData);
    }

    // If completed, add to watch history
    if (progress >= 95) {
      const historyExists = library.watchedHistory.some(
        item => item.movieId === parseInt(movieId)
      );
      
      if (!historyExists) {
        library.watchedHistory.push({
          movieId: parseInt(movieId),
          mediaType,
          watchedAt: new Date()
        });
      }
    }

    await library.save();

    res.json({
      success: true,
      message: 'Progress updated',
      progress: progressData
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// @route   DELETE /api/library/continue-watching/:movieId
// @desc    Remove from continue watching
// @access  Private
router.delete('/continue-watching/:movieId', async (req, res) => {
  try {
    const { movieId } = req.params;

    const library = await Library.findOne({ userId: req.user._id });
    
    if (!library) {
      return res.status(404).json({ error: 'Library not found' });
    }

    library.continueWatching = library.continueWatching.filter(
      item => item.movieId !== parseInt(movieId)
    );

    await library.save();

    res.json({
      success: true,
      message: 'Removed from continue watching'
    });
  } catch (error) {
    console.error('Remove from continue watching error:', error);
    res.status(500).json({ error: 'Failed to remove from continue watching' });
  }
});

// @route   GET /api/library/history
// @desc    Get watch history
// @access  Private
router.get('/history', async (req, res) => {
  try {
    const library = await Library.findOne({ userId: req.user._id });
    
    if (!library) {
      return res.json({ success: true, history: [], count: 0 });
    }

    const history = library.watchedHistory.sort(
      (a, b) => new Date(b.watchedAt) - new Date(a.watchedAt)
    );

    res.json({
      success: true,
      history,
      count: history.length
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to fetch watch history' });
  }
});

export default router;
