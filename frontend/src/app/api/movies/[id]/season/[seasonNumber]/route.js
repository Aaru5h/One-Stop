import { NextResponse } from 'next/server';
import tmdbService from '@/lib/services/tmdb';

export async function GET(request, context) {
  try {
    const { id, seasonNumber } = await context.params;
    
    const data = await tmdbService.getSeasonDetails(
      parseInt(id), 
      parseInt(seasonNumber)
    );
    return NextResponse.json(data);
  } catch (error) {
    console.error('Season details API error:', error);
    return NextResponse.json({ error: 'Failed to fetch season details' }, { status: 500 });
  }
}
