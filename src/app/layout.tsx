import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StreamPulse — Özel Medya & Video/Müzik İndirici",
  description: "Tüm platformlardan (YouTube, Instagram, TikTok, Twitter/X, Film & Dizi siteleri) tek tıkla MP3 ve MP4 indirin.",
  keywords: ["video indirici", "mp3 indir", "mp4 indir", "film indir", "dizi indir", "instagram reel indir", "tiktok video indir"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#06070b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark">
      <body className="antialiased selection:bg-purple-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
