import { NextResponse } from 'next/server';
import tmdbService from '@/lib/services/tmdb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    // Quick search with minimal data
    const results = await tmdbService.search(query.trim(), 1, 'multi');
    
    const suggestions = results.results.slice(0, 8).map(item => ({
      id: item.id,
      title: item.title,
      mediaType: item.mediaType,
      posterPath: item.posterPath,
      releaseDate: item.releaseDate
    }));

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Suggestions API error:', error);
    return NextResponse.json({ error: 'Failed to get suggestions' }, { status: 500 });
  }
}
