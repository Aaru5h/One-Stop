import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/middleware/auth';
import dbConnect from '@/lib/db/connect';
import Library from '@/lib/models/Library';
import tmdbService from '@/lib/services/tmdb';

const getUserLibrary = async (userId) => {
  if (!userId) return null;
  return await Library.findOne({ userId });
};

export async function GET(request, context) {
  try {
    await dbConnect();
    const user = await getSessionUser(request);
    
    const { id } = await context.params;
    
    const { searchParams } = new URL(request.url);
    const mediaType = searchParams.get('mediaType') || 'movie';
    
    const userLibrary = await getUserLibrary(user?._id);
    
    const data = await tmdbService.getDetails(
      parseInt(id), 
      mediaType,
      userLibrary
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error('Movie details API error:', error);
    return NextResponse.json({ error: 'Failed to fetch movie details' }, { status: 500 });
  }
}
