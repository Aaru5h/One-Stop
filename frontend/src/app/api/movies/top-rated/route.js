import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/middleware/auth';
import dbConnect from '@/lib/db/connect';
import Library from '@/lib/models/Library';
import tmdbService from '@/lib/services/tmdb';

const getUserLibrary = async (userId) => {
  if (!userId) return null;
  return await Library.findOne({ userId });
};

export async function GET(request) {
  try {
    await dbConnect();
    const user = await getSessionUser(request);
    
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const mediaType = searchParams.get('mediaType') || 'movie';
    
    const userLibrary = await getUserLibrary(user?._id);
    
    const data = await tmdbService.getTopRated(mediaType, parseInt(page));

    if (userLibrary) {
      data.results = data.results.map(movie => ({
        ...movie,
        isInWatchlist: userLibrary.isInWatchlist(movie.id),
        watchProgress: userLibrary.getProgress(movie.id)
      }));
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Top rated API error:', error);
    return NextResponse.json({ error: 'Failed to fetch top rated content' }, { status: 500 });
  }
}
