import { Nunito_Sans } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import MobileTabBar from "@/components/MobileTabBar";
import { Analytics } from "@vercel/analytics/next";
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION } from "@/lib/seo";

const nunitoSans = Nunito_Sans({
  variable: "--font-sans-nunito",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME}: Watch Movies & TV Shows Online`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ['watch movies online', 'watch TV shows online', 'streaming', 'movies', 'TV series', 'episode guide', SITE_NAME],
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: `${SITE_NAME}: Watch Movies & TV Shows Online`,
    description: SITE_DESCRIPTION,
    url: '/',
    locale: 'en_US',
  },
  twitter: { card: 'summary_large_image', title: SITE_NAME, description: SITE_DESCRIPTION },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
};

export const viewport = {
  themeColor: '#000000',
  colorScheme: 'dark',
};

const websiteJsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${nunitoSans.variable} antialiased`}
        suppressHydrationWarning
      >
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: websiteJsonLd }} />
        <Providers>
          <Navbar />
          <main className="min-h-screen">
            {children}
          </main>
          <MobileTabBar />
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
