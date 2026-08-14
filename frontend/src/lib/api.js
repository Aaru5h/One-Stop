import axios from 'axios';

// Create axios instance configured for backend
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage (client-side only)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 unauthorized
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        // Optionally redirect to login
      }
    }
    return Promise.reject(error);
  }
);

// API Methods
export const movieApi = {
  // BFF Composite Home Feed
  getHomeFeed: () =>
    api.get('/home'),

  // Trending content
  getTrending: (params = {}) => 
    api.get('/movies/trending', { params }),
  
  // Popular content
  getPopular: (params = {}) => 
    api.get('/movies/popular', { params }),
  
  // Top rated
  getTopRated: (params = {}) => 
    api.get('/movies/top-rated', { params }),
  
  // Now playing
  getNowPlaying: (params = {}) => 
    api.get('/movies/now-playing', { params }),
  
  // By genre
  getByGenre: (genreId, params = {}) => 
    api.get(`/movies/genre/${genreId}`, { params }),
  
  // Get genres list
  getGenres: (mediaType = 'movie') => 
    api.get('/movies/genres', { params: { mediaType } }),
  
  // Movie details
  getDetails: (id, mediaType = 'movie') => 
    api.get(`/movies/${id}`, { params: { mediaType } }),
  
  // Similar movies
  getSimilar: (id, params = {}) => 
    api.get(`/movies/${id}/similar`, { params }),
  
  // Recommendations
  getRecommendations: (id, params = {}) => 
    api.get(`/movies/${id}/recommendations`, { params }),
  
  // Videos (trailers, clips)
  getVideos: (id, mediaType = 'movie') => 
    api.get(`/movies/${id}/videos`, { params: { mediaType } }),
  
  // Season details with episode list (TV shows)
  getSeasonDetails: (id, seasonNumber) => 
    api.get(`/movies/${id}/season/${seasonNumber}`),
};

export const searchApi = {
  // Search content
  search: (query, params = {}) => 
    api.get('/search', { params: { query, ...params } }),
  
  // Search suggestions
  getSuggestions: (query) => 
    api.get('/search/suggestions', { params: { query } }),
};

export const authApi = {
  // Register
  register: (data) => 
    api.post('/auth/register', data),
  
  // Login
  login: (data) => 
    api.post('/auth/login', data),
  
  // Logout
  logout: () => 
    api.post('/auth/logout'),
  
  // Get current user
  getMe: () => 
    api.get('/auth/me'),
  
  // Update profile
  updateProfile: (data) => 
    api.put('/auth/profile', data),
};

export const libraryApi = {
  // Watchlist
  getWatchlist: () => 
    api.get('/library/watchlist'),
  
  addToWatchlist: (movieId, data) => 
    api.post(`/library/watchlist/${movieId}`, data),
  
  removeFromWatchlist: (movieId) => 
    api.delete(`/library/watchlist/${movieId}`),
  
  // Continue watching
  getContinueWatching: () => 
    api.get('/library/continue-watching'),
  
  getProgress: (movieId) =>
    api.get(`/library/progress/${movieId}`),
  
  updateProgress: (movieId, data) => 
    api.put(`/library/progress/${movieId}`, data),
  
  removeFromContinueWatching: (movieId) => 
    api.delete(`/library/continue-watching/${movieId}`),
  
  // Watch history
  getHistory: () => 
    api.get('/library/history'),
};

export default api;
