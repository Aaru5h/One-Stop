# Shared playback controls

The player was referenced against Cinejoy's movie `/watch/movie/1492640` and TV `/watch/tv/94664/1/1` pages, including their live episode and season menus.

## Current availability

The existing Vidking, VidSrc, SuperEmbed, 2Embed and AutoEmbed integrations return **iframe applications**, not video streams. Browser isolation prevents One Stop from replacing the controls inside those applications. They remain the default until a direct-stream service is configured. The shared episode/season browser works with these embeds now.

A native HLS/MP4 player is implemented for direct sources. Every server returned by the configured resolver uses the same controls. There is no silent fallback to an iframe in this mode. No real stream provider or credentials are included; the owner confirmed they do not currently have a stream API. This change alone does not make existing embedded-player controls identical.

## Connect a stream service

Configure these **server-only** environment variables and restart/redeploy:

```dotenv
STREAM_RESOLVER_URL=https://your-service.example/playback
# Optional, sent only to the configured resolver:
STREAM_RESOLVER_TOKEN=your-service-token
```

One Stop sends a GET request to the configured URL with `id` (TMDB ID), `type` (`movie` or `tv`), and TV-only `s` and `e`. If an existing provider uses another request/response format, add an adapter inside `src/app/api/playback/route.js`.

The response must use this shape (illustrative URLs, not working streams):

```json
{
  "sources": [
    {
      "id": "primary",
      "name": "Server 1",
      "type": "hls",
      "url": "https://media.example/title/master.m3u8",
      "subtitles": [
        { "url": "https://media.example/title/en.vtt", "language": "en", "label": "English" }
      ]
    },
    {
      "id": "backup",
      "name": "Server 2",
      "type": "mp4",
      "url": "https://media.example/title/video.mp4"
    }
  ]
}
```

Return `sources: []` when the title/episode is unavailable. Source IDs must be unique and stable. All listed sources must represent the same title and episode with compatible timelines for position-preserving failover.

Media, HLS manifests/segments/keys, and WebVTT files must permit browser CORS from the app origin. Use HTTPS in production. Browser playback cannot attach the resolver's private bearer token to media requests: supply browser-playable signed URLs when needed. The resolver token stays on the server. Signed media URLs are necessarily visible to the viewer. An iframe URL cannot be used as an HLS/MP4 source. DRM and provider-specific playback protocols require additional integrations.

## Behavior

- Shared play/pause, seek, ±10 seconds, volume/mute, speed, picture fit, subtitles, HLS quality, picture-in-picture where supported, and fullscreen.
- Server switching retains position, volume, speed and paused state. Fatal media errors try the remaining returned sources; a final failure offers retry.
- TV: episodes open in a horizontal carousel. Change season opens a compact season list. Browsing does not change the video; selecting an episode does. Current episodes have a Now Playing label. Long descriptions can expand.
- Next episode and end-of-video autoplay share the same navigation. The fullscreen container survives episode/server changes on browsers supporting element fullscreen. iOS native video fullscreen uses the operating system's controls.
- Menus close on outside click or Escape. Focus returns to the trigger. Seek/volume are keyboard-accessible ranges; Space/K toggle playback, arrows seek, M mutes and F enters fullscreen when focus is outside a control.
- Progress is stored locally and synchronized to the existing library API for authenticated viewers. Metadata failures do not block a playable stream.

## Verification

Run `node --test tests/playbackSources.test.mjs` from `frontend/` and `npm run build`. Direct playback was tested with generated, explicitly labeled synthetic video and metadata through a temporary local resolver, not with live movie/TV streams. Temporary fixtures and test servers are outside the shipped app.
