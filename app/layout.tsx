import { BaseLayout } from '@/components/templates/base-layout';
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: '%s | fami-gb\'s portfolio',
    default: "fami-gb's portfolio",
  },
  description: "ポートフォリオサイトです。",
  openGraph: {
    title: "fami-gb's portfolio",
    description: "ポートフォリオサイトです。",
    url: 'https://famigb-dev.com',
    siteName: "fami-gb's portfolio",
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "fami-gb's portfolio",
    description: "ポートフォリオサイトです。",
    creator: '@fami_gb1618',
  },
  metadataBase: new URL('https://famigb-dev.com'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <BaseLayout>
            {children}
        </BaseLayout>
      </body>
    </html>
  );
}
