import tmdbService from '@/lib/services/tmdb';
import { SITE_URL, titlePath } from '@/lib/seo';

export const revalidate = 86400;

// ponytail: popular + top-rated + trending pages only (~500 titles). Past a few thousand URLs,
// switch to generateSitemaps() and split by type/page.
const SOURCES = ['movie', 'tv'].flatMap((type) => [
  ...[1, 2, 3, 4, 5].map((page) => () => tmdbService.getPopular(type, page)),
  ...[1, 2, 3, 4, 5].map((page) => () => tmdbService.getTopRated(type, page)),
  () => tmdbService.getTrending(type, 'week', 1),
]);

export default async function sitemap() {
  const now = new Date();
  const staticPages = [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/movies`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/tv`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/search`, changeFrequency: 'monthly', priority: 0.3 },
  ].map((p) => ({ ...p, lastModified: now }));

  // A failed TMDB call just drops that batch; the sitemap still serves.
  const batches = await Promise.allSettled(SOURCES.map((load) => load()));
  const seen = new Set();
  const titles = [];
  for (const b of batches) {
    for (const item of b.status === 'fulfilled' ? b.value.results : []) {
      const url = `${SITE_URL}${titlePath(item)}`;
      if (seen.has(url)) continue;
      seen.add(url);
      titles.push({ url, lastModified: now, changeFrequency: 'weekly', priority: 0.7 });
    }
  }
  return [...staticPages, ...titles];
}
