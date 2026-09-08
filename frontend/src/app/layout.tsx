import type { Metadata, Viewport } from 'next';
import { Karla, Fraunces } from 'next/font/google';
import ReduxProvider from '../components/providers/ReduxProvider';
import SkipToMain from '../components/layout/SkipToMain';
import './globals.css';

// ─── Fonts — self-served via next/font ─────────────────────────────────────
// Theme: "Afterhours" — see /docs/theme.md for the full design system.
// UI font — clean, readable at small sizes, excellent number figures
const fontUI = Karla({
  subsets: ['latin'],
  variable: '--font-ui',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

// Editorial font — literary serif for hero text, post body, headings
const fontEditorial = Fraunces({
  subsets: ['latin'],
  variable: '--font-editorial',
  display: 'swap',
  style: ['normal', 'italic'],
  weight: ['400', '500', '600'],
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
    'mental health support',
    'emotional support',
    'anonymous social network',
    'you are not alone',
    'lived experiences',
    'human connection',
  ],
  authors:   [{ name: 'AMONG' }],
  creator:   'AMONG',
  publisher: 'AMONG',
  robots: {
    index:  true,
    follow: true,
    googleBot: {
      index:              true,
      follow:             true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet':       -1,
    },
  },
  openGraph: {
    type:        'website',
    locale:      'en_US',
    url:         'https://among.io',
    siteName:    'AMONG',
    title:       'AMONG — You are not alone in this',
    description: 'A private, anonymous space to share your lived experiences and find people who have been there too.',
    images: [
      {
        url:    '/og-image.png',
        width:  1200,
        height: 630,
        alt:    'AMONG — You are not alone in this',
      },
    ],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'AMONG — You are not alone in this',
    description: 'A private, anonymous space to share your lived experiences and find people who have been there too.',
    images:      ['/og-image.png'],
  },
};

export const viewport: Viewport = {
  width:      'device-width',
  initialScale: 1,
  // themeColor matches the pure-white background — no dark mode
  themeColor: '#FFFFFF',
};

// ─── Root Layout ─────────────────────────────────────────────────────────────

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
        {/*
          ReduxProvider must be a client component (React Context constraint).
          All server components inside can still be server components — they
          simply don't call useSelector/useDispatch themselves.
        */}
        <SkipToMain />
        <ReduxProvider>
          {children}
        </ReduxProvider>
      </body>
    </html>
  );
}
