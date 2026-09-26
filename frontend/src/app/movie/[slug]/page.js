import TitleDetail, { titleMetadata } from '@/components/TitleDetail';

// ISR: rebuilt at most once a day per title; first hit renders on demand.
export const revalidate = 86400;

// Empty list = nothing prebuilt at deploy, but every title is cached after its first render.
export function generateStaticParams() {
  return [];
}

export function generateMetadata({ params }) {
  return titleMetadata(params, 'movie');
}

export default function Page({ params }) {
  return <TitleDetail params={params} type="movie" />;
}
