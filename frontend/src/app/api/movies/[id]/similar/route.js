import { NextResponse } from 'next/server';
import tmdbService from '@/lib/services/tmdb';

export async function GET(request, context) {
  try {
    const { id } = await context.params;
    
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const mediaType = searchParams.get('mediaType') || 'movie';
    
    const data = await tmdbService.getSimilar(
      parseInt(id), 
      mediaType, 
      parseInt(page)
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error('Similar movies API error:', error);
    return NextResponse.json({ error: 'Failed to fetch similar content' }, { status: 500 });
  }
}
