import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/middleware/auth';
import dbConnect from '@/lib/db/connect';
import Library from '@/lib/models/Library';
import tmdbService from '@/lib/services/tmdb';

const getUserLibrary = async (userId) => {
  if (!userId) return null;
  return await Library.findOne({ userId });
};

/**
 * BFF Composite Endpoint: Home Feed Aggregator
 * Fetches and aggregates all critical homepage rows in parallel on the server
 */
export async function GET(request) {
  try {
    await dbConnect();
    const user = await getSessionUser(request);

    // Fetch all home data concurrently with Promise.allSettled for fault isolation
    const [
      trendingRes,
      popularRes,
      topRatedRes,
      nowPlayingRes,
      userLibrary
    ] = await Promise.all([
      tmdbService.getTrending('movie', 'week', 1).catch(err => {
        console.error('Trending fetch error in /api/home:', err);
        return { results: [] };
      }),
      tmdbService.getPopular('movie', 1).catch(err => {
        console.error('Popular fetch error in /api/home:', err);
        return { results: [] };
      }),
      tmdbService.getTopRated('movie', 1).catch(err => {
        console.error('Top rated fetch error in /api/home:', err);
        return { results: [] };
      }),
      tmdbService.getNowPlaying('movie', 1).catch(err => {
        console.error('Now playing fetch error in /api/home:', err);
        return { results: [] };
      }),
      getUserLibrary(user?._id)
    ]);

    // Helper to enrich movie lists with user library flags
    const enrich = (list = []) => {
      if (!userLibrary || !list.length) return list;
      return list.map(movie => ({
        ...movie,
        isInWatchlist: userLibrary.isInWatchlist(movie.id),
        watchProgress: userLibrary.getProgress(movie.id)
      }));
    };

    const trending = enrich(trendingRes?.results || []);
    const popular = enrich(popularRes?.results || []);
    const topRated = enrich(topRatedRes?.results || []);
    const nowPlaying = enrich(nowPlayingRes?.results || []);

    const watchlist = userLibrary?.watchlist || [];
    const continueWatching = userLibrary?.continueWatching || [];

    return NextResponse.json({
      success: true,
      hero: trending[0] || popular[0] || null,
      trending: { results: trending },
      popular: { results: popular },
      topRated: { results: topRated },
      nowPlaying: { results: nowPlaying },
      watchlist,
      continueWatching
    });
  } catch (error) {
    console.error('Home feed aggregation error:', error);
    return NextResponse.json({ error: 'Failed to aggregate home feed' }, { status: 500 });
  }
}
