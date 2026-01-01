import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import MobileTabBar from "@/components/MobileTabBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          <Navbar />
          <main className="min-h-screen">
            {children}
          </main>
          <MobileTabBar activeTab="home" />
        </Providers>
      </body>
    </html>
  );
}
