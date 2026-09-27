'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MotionConfig } from 'framer-motion';
import { useMovieDetails, useProgress, useSeasonDetails } from '@/hooks/useMovies';
import { useAuth } from '@/contexts/AuthContext';
import { libraryApi } from '@/lib/api';
import { parsePlaybackRequest } from '@/lib/playbackSources.mjs';
import UnifiedPlayer from '@/components/player/UnifiedPlayer';
import Icon from '@/components/player/PlayerIcon';
import './watch.css';

function PlayerStatus({ text, error, retry, onBack }) {
  return <div className="watch-container"><header className="native-header"><button className="watch-icon-btn" aria-label="Back" onClick={onBack}><Icon name="back" /></button></header><div className="watch-stage-screen"><div className="watch-stage-body" role={error ? 'alert' : 'status'}>
    {!error && <div className="watch-spinner" />}<p>{text}</p>{retry && <button className="watch-btn is-primary" onClick={retry}>Try again</button>}
  </div></div></div>;
}

function WatchContent({ fullscreenRoot }) {
  const params = useSearchParams();
  const router = useRouter();
  const request = parsePlaybackRequest(params);
  const onBack = () => window.history.length > 1 ? router.back() : router.push('/');
  if (!request) return <PlayerStatus text="This video link is invalid." error onBack={onBack} />;
  return <WatchTitle key={`${request.type}:${request.id}:${request.s || ''}:${request.e || ''}`} request={request} fullscreenRoot={fullscreenRoot} onBack={onBack} />;
}

function WatchTitle({ request, onBack, fullscreenRoot }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { id, type } = request;
  const season = type === 'tv' ? Number(request.s) : null;
  const episode = type === 'tv' ? Number(request.e) : null;
  const { data: content } = useMovieDetails(id, type);
  const { data: seasonData } = useSeasonDetails(type === 'tv' ? id : null, season);
  const { data: saved, isLoading: progressLoading } = useProgress(isAuthenticated ? id : null);
  const [autoplay, setAutoplay] = useState(true);
  const lastSave = useRef(-15);
  const lastPosition = useRef(null);
  const storageKey = `onestop_playback_${type}_${id}`;
  const streams = useQuery({
    queryKey: ['playback', type, id, season, episode],
    queryFn: async ({ signal }) => {
      const response = await fetch(`/api/playback?${new URLSearchParams(request)}`, { signal, cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Couldn’t load streams.');
      return payload.sources;
    },
    retry: 1, staleTime: 0, gcTime: 0, refetchOnWindowFocus: false,
  });
  const [localProgress] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey)) || null; } catch { return null; }
  });
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);
  // Read the persisted preference after mount without changing server markup.
  useEffect(() => {
    const sync = () => { try { setAutoplay(localStorage.getItem('onestop_autoplay_next') !== 'false'); } catch {} };
    const timer = setTimeout(sync, 0);
    return () => clearTimeout(timer);
  }, []);

  const changeEpisode = useCallback((nextEpisode, nextSeason) => {
    router.replace(`/watch?id=${id}&type=tv&s=${nextSeason}&e=${nextEpisode}`, { scroll: false });
  }, [router, id]);

  const onProgress = useCallback((state, force = false) => {
    if (!Number.isFinite(state.currentTime) || !Number.isFinite(state.duration) || state.duration <= 0) return;
    // Repeated pause/pagehide/cleanup events shouldn't send the same update twice.
    if (lastPosition.current === state.currentTime) return;
    if (!force && Math.abs(state.currentTime - lastSave.current) < 15) return;
    lastSave.current = state.currentTime;
    lastPosition.current = state.currentTime;
    const payload = {
      ...state, currentTime: Math.floor(state.currentTime), duration: Math.floor(state.duration),
      mediaType: type, title: content?.title || content?.name, posterPath: content?.posterPath, backdropPath: content?.backdropPath,
      ...(season && { season, episode, episodeTitle: seasonData?.episodes?.find((ep) => ep.episodeNumber === episode)?.name }),
    };
    try { localStorage.setItem(storageKey, JSON.stringify(payload)); } catch {}
    if (isAuthenticated && content) {
      libraryApi.updateProgress(Number(id), payload).then(() => queryClient.invalidateQueries({ queryKey: ['library', 'continueWatching'] })).catch(() => {});
    }
  }, [id, type, season, episode, content, seasonData, isAuthenticated, storageKey, queryClient]);

  const seasons = (content?.seasons || []).filter((s) => s.seasonNumber > 0).sort((a, b) => a.seasonNumber - b.seasonNumber);
  const episodes = seasonData?.episodes || [];
  const current = episodes.find((ep) => ep.episodeNumber === episode);
  const following = current && episodes.find((ep) => ep.episodeNumber > episode);
  const followingSeason = current && !following && seasons.find((s) => s.seasonNumber > season && s.episodeCount !== 0);
  const next = following ? { season, episode: following.episodeNumber, title: following.name }
    : followingSeason ? { season: followingSeason.seasonNumber, episode: 1, title: `${followingSeason.name || `Season ${followingSeason.seasonNumber}`} · Episode 1` } : null;
  const progress = saved?.progress || localProgress;
  const matches = type === 'movie' || (Number(progress?.season) === season && Number(progress?.episode) === episode);
  const startTime = matches && progress?.progress < 95 && Number.isFinite(Number(progress?.currentTime)) ? Math.max(0, Number(progress.currentTime)) : 0;

  if (streams.isPending || progressLoading) return <PlayerStatus text="Finding available streams" onBack={onBack} />;
  if (streams.isError) return <PlayerStatus error text={streams.error.message} retry={() => streams.refetch()} onBack={onBack} />;
  if (!streams.data?.length) return <PlayerStatus error text="No playable streams are available for this title yet." retry={() => streams.refetch()} onBack={onBack} />;

  return <UnifiedPlayer fullscreenRoot={fullscreenRoot} sources={streams.data} title={content?.title || content?.name || (type === 'tv' ? 'TV show' : 'Movie')}
    subtitle={season ? `S${season} E${episode}${current?.name ? ` · ${current.name}` : ''}` : null}
    overview={current?.overview || content?.overview} poster={content?.backdropPath || content?.posterPath}
    movieId={id} seasons={seasons} season={season} episode={episode} nextEpisode={next}
    onEpisodeChange={changeEpisode} onBack={onBack} startTime={startTime} onProgress={onProgress}
    autoplayNext={autoplay} onToggleAutoplay={() => { const next = !autoplay; setAutoplay(next); try { localStorage.setItem('onestop_autoplay_next', String(next)); } catch {} }} />;
}

export default function NativeWatchPlayer() {
  const fullscreenRoot = useRef(null);
  return <MotionConfig reducedMotion="user"><div ref={fullscreenRoot} className="watch-container"><Suspense fallback={<PlayerStatus text="Loading player" />}><WatchContent fullscreenRoot={fullscreenRoot} /></Suspense></div></MotionConfig>;
}
