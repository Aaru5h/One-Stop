import { NextResponse } from 'next/server';
import tmdbService from '@/lib/services/tmdb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mediaType = searchParams.get('mediaType') || 'movie';
    
    const genres = await tmdbService.getGenres(mediaType);
    return NextResponse.json({ genres });
  } catch (error) {
    console.error('Genres API error:', error);
    return NextResponse.json({ error: 'Failed to fetch genres' }, { status: 500 });
  }
}
