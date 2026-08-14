import axios from 'axios';
import cacheManager from '@/lib/cache/cacheManager';

// Create axios instance for TMDB API
const tmdbApi = axios.create({
  baseURL: process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3'
});

// Request interceptor to add API key dynamically
tmdbApi.interceptors.request.use((config) => {
  config.params = {
    ...config.params,
    api_key: process.env.TMDB_API_KEY
  };
  return config;
});

// Image base URLs
export const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
export const POSTER_SIZES = {
  small: 'w185',
  medium: 'w342',
  large: 'w500',
  original: 'original'
};
export const BACKDROP_SIZES = {
  small: 'w300',
  medium: 'w780',
  large: 'w1280',
  original: 'original'
};

// Transform movie data for consistent frontend format
const transformMovie = (movie, userLibrary = null, explicitMediaType = null) => {
  const transformed = {
    id: movie.id,
    title: movie.title || movie.name,
    originalTitle: movie.original_title || movie.original_name,
    overview: movie.overview,
    posterPath: movie.poster_path 
      ? `${IMAGE_BASE_URL}/${POSTER_SIZES.large}${movie.poster_path}`
      : null,
    backdropPath: movie.backdrop_path 
      ? `${IMAGE_BASE_URL}/${BACKDROP_SIZES.large}${movie.backdrop_path}`
      : null,
    releaseDate: movie.release_date || movie.first_air_date,
    voteAverage: movie.vote_average,
    voteCount: movie.vote_count,
    popularity: movie.popularity,
    genreIds: movie.genre_ids || [],
    // Use explicit mediaType if provided, then TMDB's media_type, then default to 'movie'
    mediaType: explicitMediaType || movie.media_type || 'movie',
    adult: movie.adult || false
  };

  // Stitch user library data if available
  if (userLibrary) {
    transformed.isInWatchlist = userLibrary.isInWatchlist(movie.id);
    transformed.watchProgress = userLibrary.getProgress(movie.id);
  }

  return transformed;
};

// Transform detailed movie data
const transformMovieDetails = (movie, credits = null, userLibrary = null) => {
  const transformed = {
    id: movie.id,
    title: movie.title || movie.name,
    tagline: movie.tagline,
    overview: movie.overview,
    posterPath: movie.poster_path 
      ? `${IMAGE_BASE_URL}/${POSTER_SIZES.large}${movie.poster_path}`
      : null,
    backdropPath: movie.backdrop_path 
      ? `${IMAGE_BASE_URL}/${BACKDROP_SIZES.original}${movie.backdrop_path}`
      : null,
    releaseDate: movie.release_date || movie.first_air_date,
    runtime: movie.runtime || (movie.episode_run_time && movie.episode_run_time[0]),
    voteAverage: movie.vote_average,
    voteCount: movie.vote_count,
    genres: movie.genres || [],
    status: movie.status,
    budget: movie.budget,
    revenue: movie.revenue,
    productionCompanies: movie.production_companies?.map(c => c.name) || [],
    mediaType: movie.name ? 'tv' : 'movie'
  };

  // Include real TV show season data when available
  if (movie.number_of_seasons) {
    transformed.numberOfSeasons = movie.number_of_seasons;
    transformed.numberOfEpisodes = movie.number_of_episodes;
    transformed.seasons = (movie.seasons || [])
      .filter(s => s.season_number > 0) // Exclude "Specials" (season 0)
      .map(s => ({
        id: s.id,
        seasonNumber: s.season_number,
        name: s.name,
        episodeCount: s.episode_count,
        overview: s.overview || '',
        posterPath: s.poster_path
          ? `${IMAGE_BASE_URL}/${POSTER_SIZES.medium}${s.poster_path}`
          : null,
        airDate: s.air_date
      }));
  }

  // Add credits if available
  if (credits) {
    transformed.cast = credits.cast?.slice(0, 10).map(person => ({
      id: person.id,
      name: person.name,
      character: person.character,
      profilePath: person.profile_path 
        ? `${IMAGE_BASE_URL}/w185${person.profile_path}`
        : null
    })) || [];
    
    transformed.director = credits.crew?.find(
      person => person.job === 'Director'
    )?.name || null;
  }

  // Stitch user library data
  if (userLibrary) {
    transformed.isInWatchlist = userLibrary.isInWatchlist(movie.id);
    transformed.watchProgress = userLibrary.getProgress(movie.id);
  }

  return transformed;
};

// API Methods with Cache-Aside & Circuit Breaker
export const tmdbService = {
  // Get trending movies/shows
  async getTrending(mediaType = 'movie', timeWindow = 'week', page = 1) {
    const cacheKey = `tmdb:trending:${mediaType}:${timeWindow}:${page}`;
    return cacheManager.getOrSet(cacheKey, async () => {
      const response = await tmdbApi.get(`/trending/${mediaType}/${timeWindow}`, {
        params: { page }
      });
      const explicitType = mediaType === 'all' ? null : mediaType;
      return {
        results: response.data.results.map(movie => transformMovie(movie, null, explicitType)),
        page: response.data.page,
        totalPages: response.data.total_pages,
        totalResults: response.data.total_results
      };
    }, 1000 * 60 * 30); // 30 mins TTL
  },

  // Get popular movies/shows
  async getPopular(mediaType = 'movie', page = 1) {
    const cacheKey = `tmdb:popular:${mediaType}:${page}`;
    return cacheManager.getOrSet(cacheKey, async () => {
      const response = await tmdbApi.get(`/${mediaType}/popular`, {
        params: { page }
      });
      return {
        results: response.data.results.map(movie => transformMovie(movie, null, mediaType)),
        page: response.data.page,
        totalPages: response.data.total_pages,
        totalResults: response.data.total_results
      };
    }, 1000 * 60 * 60); // 1 hour TTL
  },

  // Get top rated
  async getTopRated(mediaType = 'movie', page = 1) {
    const cacheKey = `tmdb:top_rated:${mediaType}:${page}`;
    return cacheManager.getOrSet(cacheKey, async () => {
      const response = await tmdbApi.get(`/${mediaType}/top_rated`, {
        params: { page }
      });
      return {
        results: response.data.results.map(movie => transformMovie(movie, null, mediaType)),
        page: response.data.page,
        totalPages: response.data.total_pages,
        totalResults: response.data.total_results
      };
    }, 1000 * 60 * 60); // 1 hour TTL
  },

  // Get now playing (movies) or on the air (TV)
  async getNowPlaying(mediaType = 'movie', page = 1) {
    const endpoint = mediaType === 'movie' ? '/movie/now_playing' : '/tv/on_the_air';
    const cacheKey = `tmdb:now_playing:${mediaType}:${page}`;
    return cacheManager.getOrSet(cacheKey, async () => {
      const response = await tmdbApi.get(endpoint, {
        params: { page }
      });
      return {
        results: response.data.results.map(movie => transformMovie(movie, null, mediaType)),
        page: response.data.page,
        totalPages: response.data.total_pages,
        totalResults: response.data.total_results
      };
    }, 1000 * 60 * 60); // 1 hour TTL
  },

  // Get movies by genre
  async getByGenre(genreId, mediaType = 'movie', page = 1) {
    const cacheKey = `tmdb:genre:${genreId}:${mediaType}:${page}`;
    return cacheManager.getOrSet(cacheKey, async () => {
      const response = await tmdbApi.get(`/discover/${mediaType}`, {
        params: { 
          with_genres: genreId,
          page,
          sort_by: 'popularity.desc'
        }
      });
      return {
        results: response.data.results.map(movie => transformMovie(movie, null, mediaType)),
        page: response.data.page,
        totalPages: response.data.total_pages,
        totalResults: response.data.total_results
      };
    }, 1000 * 60 * 60); // 1 hour TTL
  },

  // Get movie/show details
  async getDetails(id, mediaType = 'movie', userLibrary = null) {
    const cacheKey = `tmdb:details:${mediaType}:${id}`;
    const baseDetails = await cacheManager.getOrSet(cacheKey, async () => {
      const [detailsResponse, creditsResponse] = await Promise.all([
        tmdbApi.get(`/${mediaType}/${id}`),
        tmdbApi.get(`/${mediaType}/${id}/credits`)
      ]);
      
      return transformMovieDetails(
        detailsResponse.data, 
        creditsResponse.data,
        null
      );
    }, 1000 * 60 * 120); // 2 hours TTL

    // If user library is provided, enrich dynamically without dirtying static cache
    if (userLibrary) {
      return {
        ...baseDetails,
        isInWatchlist: userLibrary.isInWatchlist(baseDetails.id),
        watchProgress: userLibrary.getProgress(baseDetails.id)
      };
    }

    return baseDetails;
  },

  // Search movies and shows
  async search(query, page = 1, mediaType = 'multi') {
    const cacheKey = `tmdb:search:${mediaType}:${query.toLowerCase().trim()}:${page}`;
    return cacheManager.getOrSet(cacheKey, async () => {
      const response = await tmdbApi.get(`/search/${mediaType}`, {
        params: { query, page }
      });
      
      const filtered = mediaType === 'multi' 
        ? response.data.results.filter(item => item.media_type !== 'person')
        : response.data.results;

      return {
        results: filtered.map(movie => transformMovie(movie)),
        page: response.data.page,
        totalPages: response.data.total_pages,
        totalResults: response.data.total_results
      };
    }, 1000 * 60 * 5); // 5 mins TTL
  },

  // Get genre list
  async getGenres(mediaType = 'movie') {
    const cacheKey = `tmdb:genres:${mediaType}`;
    return cacheManager.getOrSet(cacheKey, async () => {
      const response = await tmdbApi.get(`/genre/${mediaType}/list`);
      return response.data.genres;
    }, 1000 * 60 * 60 * 24); // 24 hours TTL
  },

  // Get similar movies
  async getSimilar(id, mediaType = 'movie', page = 1) {
    const cacheKey = `tmdb:similar:${mediaType}:${id}:${page}`;
    return cacheManager.getOrSet(cacheKey, async () => {
      const response = await tmdbApi.get(`/${mediaType}/${id}/similar`, {
        params: { page }
      });
      return {
        results: response.data.results.map(movie => transformMovie(movie, null, mediaType)),
        page: response.data.page,
        totalPages: response.data.total_pages,
        totalResults: response.data.total_results
      };
    }, 1000 * 60 * 120); // 2 hours TTL
  },

  // Get recommendations
  async getRecommendations(id, mediaType = 'movie', page = 1) {
    const cacheKey = `tmdb:recommendations:${mediaType}:${id}:${page}`;
    return cacheManager.getOrSet(cacheKey, async () => {
      const response = await tmdbApi.get(`/${mediaType}/${id}/recommendations`, {
        params: { page }
      });
      return {
        results: response.data.results.map(movie => transformMovie(movie, null, mediaType)),
        page: response.data.page,
        totalPages: response.data.total_pages,
        totalResults: response.data.total_results
      };
    }, 1000 * 60 * 120); // 2 hours TTL
  },

  // Get videos (trailers, clips, etc.)
  async getVideos(id, mediaType = 'movie') {
    const cacheKey = `tmdb:videos:${mediaType}:${id}`;
    return cacheManager.getOrSet(cacheKey, async () => {
      const response = await tmdbApi.get(`/${mediaType}/${id}/videos`);
      
      const videos = response.data.results || [];
      
      const sorted = videos
        .filter(v => v.site === 'YouTube')
        .sort((a, b) => {
          const aScore = (a.official ? 10 : 0) + 
                         (a.type === 'Trailer' ? 5 : 0) + 
                         (a.type === 'Teaser' ? 3 : 0);
          const bScore = (b.official ? 10 : 0) + 
                         (b.type === 'Trailer' ? 5 : 0) + 
                         (b.type === 'Teaser' ? 3 : 0);
          return bScore - aScore;
        });

      return {
        results: sorted.map(video => ({
          id: video.id,
          key: video.key,
          name: video.name,
          type: video.type,
          official: video.official,
          site: video.site,
          size: video.size
        }))
      };
    }, 1000 * 60 * 120); // 2 hours TTL
  },

  // Get season details with full episode list
  async getSeasonDetails(tvId, seasonNumber) {
    const cacheKey = `tmdb:season:${tvId}:${seasonNumber}`;
    return cacheManager.getOrSet(cacheKey, async () => {
      const response = await tmdbApi.get(`/tv/${tvId}/season/${seasonNumber}`);
      const season = response.data;

      return {
        id: season.id,
        seasonNumber: season.season_number,
        name: season.name,
        overview: season.overview || '',
        airDate: season.air_date,
        posterPath: season.poster_path
          ? `${IMAGE_BASE_URL}/${POSTER_SIZES.medium}${season.poster_path}`
          : null,
        episodes: (season.episodes || []).map(ep => ({
          id: ep.id,
          episodeNumber: ep.episode_number,
          name: ep.name,
          overview: ep.overview || '',
          stillPath: ep.still_path
            ? `${IMAGE_BASE_URL}/${BACKDROP_SIZES.small}${ep.still_path}`
            : null,
          airDate: ep.air_date,
          runtime: ep.runtime,
          voteAverage: ep.vote_average
        }))
      };
    }, 1000 * 60 * 120); // 2 hours TTL
  }
};

export default tmdbService;
