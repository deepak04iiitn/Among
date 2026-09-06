import type { Metadata, Viewport } from 'next';
import { Inter, Lora } from 'next/font/google';
import './globals.css';

// ─── Fonts ──────────────────────────────────────────────────────────────────
// UI font — clean, contemporary sans-serif
const fontUI = Inter({
  subsets: ['latin'],
  variable: '--font-ui',
  display: 'swap',
});

// Editorial font — serif for headings and post body text
const fontEditorial = Lora({
  subsets: ['latin'],
  variable: '--font-editorial',
  display: 'swap',
  style: ['normal', 'italic'],
});

// ─── Default Metadata ────────────────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://among.io'
  ),
  title: {
    default: 'AMONG — You are not alone in this',
    template: '%s | AMONG',
  },
  description:
    'A private, anonymous space to share your lived experiences and find people who have been there too. No names. No followers. Just truth.',
  keywords: [
    'anonymous community',
    'shared experiences',
    'mental health',
    'emotional support',
    'anonymous social network',
    'you are not alone',
  ],
  authors: [{ name: 'AMONG' }],
  creator: 'AMONG',
  publisher: 'AMONG',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://among.io',
    siteName: 'AMONG',
    title: 'AMONG — You are not alone in this',
    description:
      'A private, anonymous space to share your lived experiences and find people who have been there too.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AMONG — You are not alone in this',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AMONG — You are not alone in this',
    description:
      'A private, anonymous space to share your lived experiences and find people who have been there too.',
    images: ['/og-image.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafaf9' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1117' },
  ],
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontUI.variable} ${fontEditorial.variable}`}
    >
      <body>
        {children}
      </body>
    </html>
  );
}
