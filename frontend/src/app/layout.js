import { Nunito_Sans } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import MobileTabBar from "@/components/MobileTabBar";
import { Analytics } from "@vercel/analytics/next";

const nunitoSans = Nunito_Sans({
  variable: "--font-sans-nunito",
  subsets: ["latin"],
});

export const metadata = {
  title: "One Stop — Premium Streaming",
  description: "The ultimate streaming platform with a Liquid Glass experience. Watch movies and TV shows in stunning quality.",
  keywords: ["streaming", "movies", "TV shows", "entertainment", "One Stop"],
  openGraph: {
    title: "One Stop — Premium Streaming",
    description: "The ultimate streaming platform with a Liquid Glass experience.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${nunitoSans.variable} antialiased`}
        suppressHydrationWarning
      >
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
