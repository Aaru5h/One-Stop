export const metadata = {
  // Object form keeps the root "%s · One Stop" template alive for /tv/[slug] below this layout.
  title: { default: 'TV Shows', template: '%s · One Stop' },
  description: 'Browse popular and top-rated TV series with full season and episode guides on One Stop.',
  alternates: { canonical: '/tv' },
};

export default function Layout({ children }) {
  return children;
}
