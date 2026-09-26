// Server-rendered title page for /movie/[slug] and /tv/[slug]. Real HTML + metadata + JSON-LD,
// so search engines can index every title (the home modal and /watch are client-only).
import { cache } from 'react';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import tmdbService from '@/lib/services/tmdb';
import { SITE_NAME, SITE_URL, idFromSlug, titlePath, watchPath } from '@/lib/seo';

// Deduped across generateMetadata + page in one request; cacheManager covers repeat requests.
const loadTitle = cache(async (id, type) => {
  try {
    const [details, similar] = await Promise.all([
      tmdbService.getDetails(id, type),
      tmdbService.getSimilar(id, type).catch(() => ({ results: [] })),
    ]);
    return { details: { ...details, mediaType: type }, similar: similar.results || [] };
  } catch (err) {
    // A real 404 from TMDB → our 404. Anything else (network, rate limit) is a 500, so crawlers retry
    // instead of dropping the page from the index.
    if (err?.response?.status === 404) return null;
    throw err;
  }
});

const sized = (url, size) => url?.replace(/\/t\/p\/[^/]+\//, `/t/p/${size}/`);
const yearOf = (d) => (d ? new Date(d).getFullYear() : null);

function describe(t) {
  const year = yearOf(t.releaseDate);
  const kind = t.mediaType === 'tv' ? 'TV series' : 'movie';
  const genre = t.genres?.[0]?.name?.toLowerCase();
  const article = genre && /^[aeiou]/.test(genre) ? 'an' : 'a';
  const lead = `Watch ${t.title}${year ? ` (${year})` : ''} online, ${genre ? `${article} ${genre} ${kind}` : `the ${kind}`}`;
  const text = lead + (t.overview ? `. ${t.overview}` : '.');
  return text.length > 160 ? `${text.slice(0, 157).replace(/\s+\S*$/, '')}…` : text;
}

async function resolve(params, type) {
  const { slug } = await params;
  const id = idFromSlug(slug);
  if (!id) notFound();
  const data = await loadTitle(id, type);
  if (!data) notFound();
  return { slug, data };
}

export async function titleMetadata(params, type) {
  const { data } = await resolve(params, type);
  const t = data.details;
  const year = yearOf(t.releaseDate);
  const title = `${t.title}${year ? ` (${year})` : ''}${type === 'tv' ? ' · TV Series' : ''}`;
  const description = describe(t);
  const path = titlePath(t);
  const image = sized(t.backdropPath, 'w1280') || t.posterPath;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: type === 'tv' ? 'video.tv_show' : 'video.movie',
      title,
      description,
      url: path,
      images: image ? [{ url: image, width: 1280, height: 720, alt: t.title }] : undefined,
    },
    twitter: { card: 'summary_large_image', title, description, images: image ? [image] : undefined },
  };
}

function jsonLd(t) {
  const url = `${SITE_URL}${titlePath(t)}`;
  const base = {
    '@context': 'https://schema.org',
    '@type': t.mediaType === 'tv' ? 'TVSeries' : 'Movie',
    name: t.title,
    url,
    description: t.overview || undefined,
    image: t.posterPath || undefined,
    genre: t.genres?.map((g) => g.name),
    actor: t.cast?.slice(0, 6).map((c) => ({ '@type': 'Person', name: c.name })),
    ...(t.voteCount > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: Number(t.voteAverage?.toFixed(1)),
        bestRating: 10,
        worstRating: 0,
        ratingCount: t.voteCount,
      },
    }),
  };
  if (t.mediaType === 'tv') {
    Object.assign(base, {
      startDate: t.releaseDate || undefined,
      numberOfSeasons: t.numberOfSeasons,
      numberOfEpisodes: t.numberOfEpisodes,
    });
  } else {
    Object.assign(base, {
      datePublished: t.releaseDate || undefined,
      director: t.director ? { '@type': 'Person', name: t.director } : undefined,
      duration: t.runtime ? `PT${Math.floor(t.runtime / 60)}H${t.runtime % 60}M` : undefined,
    });
  }
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: SITE_NAME, item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: t.mediaType === 'tv' ? 'TV Shows' : 'Movies', item: `${SITE_URL}/${t.mediaType === 'tv' ? 'tv' : 'movies'}` },
      { '@type': 'ListItem', position: 3, name: t.title, item: url },
    ],
  };
  // Escape "<" so a title/overview can never close the script tag.
  return JSON.stringify([base, breadcrumbs]).replace(/</g, '\\u003c');
}

const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
    <path d="M11.1 2.9a1 1 0 0 1 1.8 0l2.3 4.7 5.2.8a1 1 0 0 1 .6 1.7l-3.8 3.7.9 5.2a1 1 0 0 1-1.5 1l-4.6-2.4-4.6 2.4a1 1 0 0 1-1.5-1l.9-5.2-3.8-3.7a1 1 0 0 1 .6-1.7l5.2-.8 2.3-4.7z" />
  </svg>
);

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
    <path d="M6 4.8v14.4c0 .8.9 1.3 1.6.9l11.3-7.2c.6-.4.6-1.4 0-1.8L7.6 3.9C6.9 3.5 6 4 6 4.8z" />
  </svg>
);

export default async function TitleDetail({ params, type }) {
  const { slug, data } = await resolve(params, type);
  const t = data.details;

  // One canonical URL per title: /movie/603 or a stale slug → /movie/603-the-matrix
  const canonical = titlePath(t);
  if (`/${type}/${slug}` !== canonical) permanentRedirect(canonical);

  const year = yearOf(t.releaseDate);
  const hours = t.runtime ? Math.floor(t.runtime / 60) : 0;
  const runtime = t.runtime ? `${hours ? `${hours}h ` : ''}${t.runtime % 60}m` : null;
  const seasons = t.seasons || [];

  return (
    <article className="min-h-screen bg-black pb-28 md:pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(t) }} />

      {/* Hero */}
      <section className="relative min-h-[78vh] flex items-end overflow-hidden">
        {t.backdropPath && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={sized(t.backdropPath, 'w1280')}
            alt=""
            fetchPriority="high"
            className="absolute inset-0 w-full h-full object-cover object-top opacity-60"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />

        <div className="relative w-full max-w-7xl mx-auto px-5 md:px-16 pt-32 pb-10 flex gap-8 items-end">
          {t.posterPath && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sized(t.posterPath, 'w342')}
              alt={`${t.title} poster`}
              width={220}
              height={330}
              className="hidden md:block w-[220px] aspect-[2/3] rounded-xl object-cover shadow-2xl ring-1 ring-white/10"
            />
          )}
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.05] [text-wrap:balance]">{t.title}</h1>
            {t.tagline && <p className="mt-3 text-white/70 italic">{t.tagline}</p>}

            <ul className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/70">
              {t.voteAverage > 0 && (
                <li className="inline-flex items-center gap-1 font-semibold text-[#46d369]">
                  <StarIcon />
                  <span className="sr-only">Rated </span>{t.voteAverage.toFixed(1)}<span className="sr-only"> out of 10</span>
                </li>
              )}
              <li>{type === 'tv' ? 'TV Series' : 'Movie'}</li>
              {year && <li>{year}</li>}
              {runtime && type === 'movie' && <li>{runtime}</li>}
              {type === 'tv' && t.numberOfSeasons && (
                <li>{t.numberOfSeasons} season{t.numberOfSeasons > 1 ? 's' : ''}</li>
              )}
              {t.genres?.slice(0, 3).map((g) => (
                <li key={g.id} className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/80">{g.name}</li>
              ))}
            </ul>

            {t.overview && <p className="mt-5 text-base md:text-lg leading-relaxed text-white/80 line-clamp-4">{t.overview}</p>}

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={watchPath(t)}
                className="inline-flex items-center gap-2 h-12 px-7 rounded-full bg-white text-black font-bold hover:bg-white/85 transition-colors"
              >
                <PlayIcon />
                {type === 'tv' ? 'Play S1 E1' : 'Play'}
              </Link>
            </div>

            {(t.director || t.cast?.length > 0) && (
              <dl className="mt-6 grid gap-1 text-sm">
                {t.director && (
                  <div className="flex gap-2"><dt className="text-white/60">Director</dt><dd className="text-white/80">{t.director}</dd></div>
                )}
                {t.cast?.length > 0 && (
                  <div className="flex gap-2">
                    <dt className="text-white/60">Starring</dt>
                    <dd className="text-white/80">{t.cast.slice(0, 4).map((c) => c.name).join(', ')}</dd>
                  </div>
                )}
              </dl>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-5 md:px-16 space-y-14 mt-6">
        {/* Seasons */}
        {type === 'tv' && seasons.length > 0 && (
          <section aria-labelledby="seasons-heading">
            <h2 id="seasons-heading" className="text-xl md:text-2xl font-bold text-white mb-5">Seasons</h2>
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {seasons.map((s) => (
                <li key={s.seasonNumber}>
                  <Link href={watchPath(t, s.seasonNumber, 1)} className="group block">
                    <div className="aspect-[2/3] rounded-xl overflow-hidden bg-white/5 ring-1 ring-white/10">
                      {s.posterPath ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.posterPath} alt={`${t.title} ${s.name}`} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl font-extrabold text-white/30">{s.seasonNumber}</div>
                      )}
                    </div>
                    <p className="mt-2 text-sm font-semibold text-white">{s.name}</p>
                    <p className="text-xs text-white/60">
                      {s.episodeCount} episodes{s.airDate ? ` · ${yearOf(s.airDate)}` : ''}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Cast */}
        {t.cast?.length > 0 && (
          <section aria-labelledby="cast-heading">
            <h2 id="cast-heading" className="text-xl md:text-2xl font-bold text-white mb-5">Cast</h2>
            <ul className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none]">
              {t.cast.map((c) => (
                <li key={c.id} className="flex-none w-28 text-center">
                  <div className="w-28 h-28 rounded-full overflow-hidden bg-white/5 ring-1 ring-white/10">
                    {c.profilePath ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.profilePath} alt={c.name} loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center text-2xl font-bold text-white/50" aria-hidden="true">
                        {c.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm font-semibold text-white truncate">{c.name}</p>
                  {c.character && <p className="text-xs text-white/60 truncate">{c.character}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* More like this: internal links spread crawl equity across titles */}
        {data.similar.length > 0 && (
          <section aria-labelledby="similar-heading">
            <h2 id="similar-heading" className="text-xl md:text-2xl font-bold text-white mb-5">More like {t.title}</h2>
            <ul className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {data.similar.slice(0, 12).map((m) => (
                <li key={m.id}>
                  <Link href={titlePath({ ...m, mediaType: type })} className="group block">
                    <div className="aspect-[2/3] rounded-xl overflow-hidden bg-white/5 ring-1 ring-white/10">
                      {m.posterPath && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={sized(m.posterPath, 'w342')} alt={`${m.title} poster`} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      )}
                    </div>
                    <p className="mt-2 text-sm text-white/80 truncate group-hover:text-white">{m.title}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </article>
  );
}
