import LegacyWatchPlayer from './LegacyWatchPlayer';
import NativeWatchPlayer from './NativeWatchPlayer';

// An embed URL is a whole application, not a media source. Only direct-stream
// providers can use our controls. Keep existing playback until one is connected.
export const dynamic = 'force-dynamic';

export default function WatchPage() {
  return process.env.STREAM_RESOLVER_URL
    ? <NativeWatchPlayer />
    : <LegacyWatchPlayer />;
}
