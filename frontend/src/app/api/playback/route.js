import { NextResponse } from 'next/server';
import { normalizeSources, parsePlaybackRequest } from '@/lib/playbackSources.mjs';

export const dynamic = 'force-dynamic';
const reply = (body, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });

export async function GET(request) {
  const query = parsePlaybackRequest(new URL(request.url).searchParams);
  if (!query) return reply({ error: 'Invalid title or episode.' }, 400);
  if (!process.env.STREAM_RESOLVER_URL) return reply({ error: 'A direct-stream service has not been connected.' }, 503);
  try {
    // Destination and credentials are operator configuration, never browser input.
    const url = new URL(process.env.STREAM_RESOLVER_URL);
    for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
    const response = await fetch(url, {
      headers: process.env.STREAM_RESOLVER_TOKEN ? { Authorization: `Bearer ${process.env.STREAM_RESOLVER_TOKEN}` } : {},
      cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) return reply({ error: 'The stream service is unavailable. Try again.' }, 502);
    return reply({ sources: normalizeSources(await response.json()) });
  } catch {
    // Never log signed URLs or upstream credentials.
    return reply({ error: 'Couldn’t load playable streams. Try again.' }, 502);
  }
}
