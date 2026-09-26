// The player page is an iframe with no indexable content; the /movie and /tv detail pages rank instead.
export const metadata = {
  title: 'Watch',
  robots: { index: false, follow: true },
};

export default function WatchLayout({ children }) {
  return children;
}
