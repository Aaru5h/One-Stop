import { NextResponse } from 'next/server';
import tmdbService from '@/lib/services/tmdb';

export async function GET(request, context) {
  try {
    const { id } = await context.params;
    
    const { searchParams } = new URL(request.url);
    const mediaType = searchParams.get('mediaType') || 'movie';
    
    const data = await tmdbService.getVideos(parseInt(id), mediaType);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Videos API error:', error);
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
  }
}
