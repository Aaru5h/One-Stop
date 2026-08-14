'use client';

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { movieApi, searchApi, libraryApi } from '@/lib/api';

// Query keys
export const queryKeys = {
  homeFeed: () => ['home', 'feed'],
  trending: (params) => ['movies', 'trending', params],
  popular: (params) => ['movies', 'popular', params],
  topRated: (params) => ['movies', 'topRated', params],
  nowPlaying: (params) => ['movies', 'nowPlaying', params],
  byGenre: (genreId, params) => ['movies', 'genre', genreId, params],
  genres: (mediaType) => ['genres', mediaType],
  details: (id, mediaType) => ['movie', id, mediaType],
  similar: (id, params) => ['movies', 'similar', id, params],
  recommendations: (id, params) => ['movies', 'recommendations', id, params],
  search: (query, params) => ['search', query, params],
  watchlist: () => ['library', 'watchlist'],
  continueWatching: () => ['library', 'continueWatching'],
  progress: (movieId) => ['library', 'progress', movieId],
  seasonDetails: (id, seasonNumber) => ['tv', id, 'season', seasonNumber],
};

// BFF Composite Home Feed hook (loads all initial rows in 1 network call)
export function useHomeFeed() {
  return useQuery({
    queryKey: queryKeys.homeFeed(),
    queryFn: () => movieApi.getHomeFeed().then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Trending movies hook
export function useTrending(params = {}) {
  return useQuery({
    queryKey: queryKeys.trending(params),
    queryFn: () => movieApi.getTrending(params).then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Infinite trending for scroll-to-load
export function useInfiniteTrending(params = {}) {
  return useInfiniteQuery({
    queryKey: ['movies', 'trending', 'infinite', params],
    queryFn: ({ pageParam = 1 }) => 
      movieApi.getTrending({ ...params, page: pageParam }).then(res => res.data),
    getNextPageParam: (lastPage) => 
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    staleTime: 5 * 60 * 1000,
  });
}

// Popular movies hook
export function usePopular(params = {}) {
  return useQuery({
    queryKey: queryKeys.popular(params),
    queryFn: () => movieApi.getPopular(params).then(res => res.data),
    staleTime: 5 * 60 * 1000,
  });
}

// Top rated movies hook
export function useTopRated(params = {}) {
  return useQuery({
    queryKey: queryKeys.topRated(params),
    queryFn: () => movieApi.getTopRated(params).then(res => res.data),
    staleTime: 5 * 60 * 1000,
  });
}

// Now playing movies hook
export function useNowPlaying(params = {}) {
  return useQuery({
    queryKey: queryKeys.nowPlaying(params),
    queryFn: () => movieApi.getNowPlaying(params).then(res => res.data),
    staleTime: 5 * 60 * 1000,
  });
}

// Movies by genre hook
export function useMoviesByGenre(genreId, params = {}) {
  return useQuery({
    queryKey: queryKeys.byGenre(genreId, params),
    queryFn: () => movieApi.getByGenre(genreId, params).then(res => res.data),
    enabled: !!genreId,
    staleTime: 5 * 60 * 1000,
  });
}

// Infinite movies by genre
export function useInfiniteMoviesByGenre(genreId, params = {}) {
  return useInfiniteQuery({
    queryKey: ['movies', 'genre', genreId, 'infinite', params],
    queryFn: ({ pageParam = 1 }) => 
      movieApi.getByGenre(genreId, { ...params, page: pageParam }).then(res => res.data),
    getNextPageParam: (lastPage) => 
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    enabled: !!genreId,
    staleTime: 5 * 60 * 1000,
  });
}

// Genres list hook
export function useGenres(mediaType = 'movie') {
  return useQuery({
    queryKey: queryKeys.genres(mediaType),
    queryFn: () => movieApi.getGenres(mediaType).then(res => res.data),
    staleTime: 60 * 60 * 1000, // 1 hour - genres don't change often
  });
}

// Movie details hook
export function useMovieDetails(id, mediaType = 'movie') {
  return useQuery({
    queryKey: queryKeys.details(id, mediaType),
    queryFn: () => movieApi.getDetails(id, mediaType).then(res => res.data),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Similar movies hook
export function useSimilar(id, params = {}) {
  return useQuery({
    queryKey: queryKeys.similar(id, params),
    queryFn: () => movieApi.getSimilar(id, params).then(res => res.data),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}

// Recommendations hook
export function useRecommendations(id, params = {}) {
  return useQuery({
    queryKey: queryKeys.recommendations(id, params),
    queryFn: () => movieApi.getRecommendations(id, params).then(res => res.data),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}

// Movie videos (trailers) hook
export function useMovieVideos(id, mediaType = 'movie') {
  return useQuery({
    queryKey: ['movie', id, 'videos', mediaType],
    queryFn: () => movieApi.getVideos(id, mediaType).then(res => res.data),
    enabled: !!id,
    staleTime: 30 * 60 * 1000, // 30 minutes - videos don't change often
  });
}

// Season details hook — fetches real episode names & data for a TV season
export function useSeasonDetails(tvId, seasonNumber) {
  return useQuery({
    queryKey: queryKeys.seasonDetails(tvId, seasonNumber),
    queryFn: () => movieApi.getSeasonDetails(tvId, seasonNumber).then(res => res.data),
    enabled: !!tvId && !!seasonNumber,
    staleTime: 30 * 60 * 1000, // 30 minutes — season data is stable
  });
}

// Search hook with debounce
export function useSearch(query, params = {}) {
  return useQuery({
    queryKey: queryKeys.search(query, params),
    queryFn: () => searchApi.search(query, params).then(res => res.data),
    enabled: query?.length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Infinite search results
export function useInfiniteSearch(query, params = {}) {
  return useInfiniteQuery({
    queryKey: ['search', query, 'infinite', params],
    queryFn: ({ pageParam = 1 }) => 
      searchApi.search(query, { ...params, page: pageParam }).then(res => res.data),
    getNextPageParam: (lastPage) => 
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    enabled: query?.length >= 2,
    staleTime: 2 * 60 * 1000,
  });
}

// Watchlist hooks
export function useWatchlist() {
  return useQuery({
    queryKey: queryKeys.watchlist(),
    queryFn: () => libraryApi.getWatchlist().then(res => res.data),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useAddToWatchlist() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ movieId, data }) => libraryApi.addToWatchlist(movieId, data),
    onMutate: async ({ movieId, data }) => {
      // Cancel outgoing queries to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.watchlist() });

      // Snapshot previous value
      const previousWatchlist = queryClient.getQueryData(queryKeys.watchlist());

      // Optimistically update watchlist cache
      queryClient.setQueryData(queryKeys.watchlist(), (old) => {
        const currentList = old?.watchlist || [];
        const exists = currentList.some(item => String(item.movieId) === String(movieId));
        if (exists) return old;
        return {
          ...old,
          watchlist: [{ movieId, ...data, addedAt: new Date().toISOString() }, ...currentList]
        };
      });

      return { previousWatchlist };
    },
    onError: (err, variables, context) => {
      if (context?.previousWatchlist !== undefined) {
        queryClient.setQueryData(queryKeys.watchlist(), context.previousWatchlist);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.watchlist() });
      queryClient.invalidateQueries({ queryKey: queryKeys.homeFeed() });
    }
  });
}

export function useRemoveFromWatchlist() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (movieId) => libraryApi.removeFromWatchlist(movieId),
    onMutate: async (movieId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.watchlist() });

      const previousWatchlist = queryClient.getQueryData(queryKeys.watchlist());

      queryClient.setQueryData(queryKeys.watchlist(), (old) => {
        if (!old?.watchlist) return old;
        return {
          ...old,
          watchlist: old.watchlist.filter(item => String(item.movieId) !== String(movieId))
        };
      });

      return { previousWatchlist };
    },
    onError: (err, variables, context) => {
      if (context?.previousWatchlist !== undefined) {
        queryClient.setQueryData(queryKeys.watchlist(), context.previousWatchlist);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.watchlist() });
      queryClient.invalidateQueries({ queryKey: queryKeys.homeFeed() });
    }
  });
}

// Continue watching hooks
export function useContinueWatching() {
  return useQuery({
    queryKey: queryKeys.continueWatching(),
    queryFn: () => libraryApi.getContinueWatching().then(res => res.data),
    staleTime: 60 * 1000,
  });
}

export function useProgress(movieId) {
  return useQuery({
    queryKey: queryKeys.progress(movieId),
    queryFn: () => libraryApi.getProgress(movieId).then(res => res.data),
    enabled: !!movieId,
    staleTime: 0, // Always fetch fresh progress when watch page is loaded
  });
}

export function useUpdateProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ movieId, data }) => libraryApi.updateProgress(movieId, data),
    onMutate: async ({ movieId, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.continueWatching() });
      const previousCW = queryClient.getQueryData(queryKeys.continueWatching());

      queryClient.setQueryData(queryKeys.continueWatching(), (old) => {
        const currentList = old?.continueWatching || [];
        const index = currentList.findIndex(item => String(item.movieId) === String(movieId));
        let updatedList;
        if (index > -1) {
          updatedList = [...currentList];
          updatedList[index] = { ...updatedList[index], ...data, lastWatched: new Date().toISOString() };
        } else {
          updatedList = [{ movieId, ...data, lastWatched: new Date().toISOString() }, ...currentList];
        }
        return { ...old, continueWatching: updatedList };
      });

      return { previousCW };
    },
    onError: (err, variables, context) => {
      if (context?.previousCW !== undefined) {
        queryClient.setQueryData(queryKeys.continueWatching(), context.previousCW);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.continueWatching() });
    }
  });
}

export function useRemoveFromContinueWatching() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (movieId) => libraryApi.removeFromContinueWatching(movieId),
    onMutate: async (movieId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.continueWatching() });
      const previousCW = queryClient.getQueryData(queryKeys.continueWatching());

      queryClient.setQueryData(queryKeys.continueWatching(), (old) => {
        if (!old?.continueWatching) return old;
        return {
          ...old,
          continueWatching: old.continueWatching.filter(item => String(item.movieId) !== String(movieId))
        };
      });

      return { previousCW };
    },
    onError: (err, variables, context) => {
      if (context?.previousCW !== undefined) {
        queryClient.setQueryData(queryKeys.continueWatching(), context.previousCW);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.continueWatching() });
    }
  });
}
