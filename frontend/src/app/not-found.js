import Link from 'next/link';

export const metadata = { title: 'Not found', robots: { index: false } };

export default function NotFound() {
  return (
    <section className="min-h-[80vh] flex flex-col items-center justify-center gap-5 px-6 text-center">
      <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white [text-wrap:balance]">
        We couldn&apos;t find that title
      </h1>
      <p className="max-w-md text-white/70">
        The link may be old, or the movie or show was removed. Try searching for it instead.
      </p>
      <div className="flex gap-3">
        <Link href="/search" className="h-11 px-6 inline-flex items-center rounded-full bg-white text-black font-bold hover:bg-white/85 transition-colors">
          Search
        </Link>
        <Link href="/" className="h-11 px-6 inline-flex items-center rounded-full bg-white/10 text-white font-semibold hover:bg-white/15 transition-colors">
          Go home
        </Link>
      </div>
    </section>
  );
}
