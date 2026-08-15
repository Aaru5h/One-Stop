import mongoose from 'mongoose';

const watchlistItemSchema = new mongoose.Schema({
  movieId: {
    type: Number,
    required: true
  },
  mediaType: {
    type: String,
    enum: ['movie', 'tv'],
    default: 'movie'
  },
  title: String,
  posterPath: String,
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const continueWatchingSchema = new mongoose.Schema({
  movieId: {
    type: Number,
    required: true
  },
  mediaType: {
    type: String,
    enum: ['movie', 'tv'],
    default: 'movie'
  },
  title: String,
  posterPath: String,
  backdropPath: String,
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  currentTime: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number,
    default: 0
  },
  // TV show episode tracking
  season: {
    type: Number,
    default: null
  },
  episode: {
    type: Number,
    default: null
  },
  episodeTitle: {
    type: String,
    default: null
  },
  lastWatched: {
    type: Date,
    default: Date.now
  }
});

const librarySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  watchlist: [watchlistItemSchema],
  continueWatching: [continueWatchingSchema],
  watchedHistory: [{
    movieId: Number,
    mediaType: {
      type: String,
      enum: ['movie', 'tv'],
      default: 'movie'
    },
    watchedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for faster lookups
librarySchema.index({ 'watchlist.movieId': 1 });
librarySchema.index({ 'continueWatching.movieId': 1 });

// Method to check if movie is in watchlist
librarySchema.methods.isInWatchlist = function(movieId) {
  return this.watchlist.some(item => item.movieId === movieId);
};

// Method to get continue watching progress
librarySchema.methods.getProgress = function(movieId) {
  const item = this.continueWatching.find(item => item.movieId === movieId);
  return item ? item.progress : 0;
};

const Library = mongoose.models.Library || mongoose.model('Library', librarySchema);

export default Library;
