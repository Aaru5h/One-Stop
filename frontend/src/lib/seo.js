// Shared SEO helpers: canonical site URL and Cinejoy-style slug URLs (/movie/603-the-matrix).

export const SITE_NAME = 'One Stop';
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://one-stop-zvu1.vercel.app').replace(/\/$/, '');
export const SITE_DESCRIPTION =
  'Watch movies and TV shows online in one place. Browse trending films, top-rated series, full episode guides, cast and ratings on One Stop.';

export function slugify(text = '') {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// /movie/603-the-matrix or /tv/1396-breaking-bad. Only the leading id matters when parsing.
export function titlePath(item) {
  const type = item?.mediaType === 'tv' ? 'tv' : 'movie';
  const slug = slugify(item?.title || item?.name || '');
  return `/${type}/${item.id}${slug ? `-${slug}` : ''}`;
}

export function idFromSlug(slug) {
  const id = Number.parseInt(String(slug), 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function watchPath(item, season, episode) {
  if (item?.mediaType === 'tv') return `/watch?id=${item.id}&type=tv&s=${season || 1}&e=${episode || 1}`;
  return `/watch?id=${item.id}&type=movie`;
}
