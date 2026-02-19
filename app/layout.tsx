import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Cinzel } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const cinzel = Cinzel({
  variable: '--font-cinzel',
  subsets: ['latin'],
});

const appUrl =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'https://vox-populi-five.vercel.app');

const ogImage = `${appUrl}/api/og`;

// Farcaster Mini App embed configuration
const miniAppEmbed = {
  version: '1',
  imageUrl: ogImage,
  button: {
    title: 'Deposit & Earn',
    action: {
      type: 'launch_frame',
      name: 'Vox Populi',
      url: appUrl,
      splashImageUrl: `${appUrl}/splash.svg`,
      splashBackgroundColor: '#0a0a0a',
    },
  },
};

export const metadata: Metadata = {
  title: 'Vox Populi',
  description:
    'Stake USDC on Base. Earn yield via Aave V3. Fund independent journalism.',
  metadataBase: new URL(appUrl),
  openGraph: {
    title: 'Vox Populi — Earn yield. Fund journalism.',
    description:
      'Stake USDC on Base, earn yield via Aave V3, and automatically share a portion with an independent journalism fund.',
    type: 'website',
    images: [{ url: ogImage, width: 1200, height: 630, alt: 'Vox Populi' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vox Populi — Earn yield. Fund journalism.',
    description:
      'Stake USDC on Base, earn yield via Aave V3, and automatically share a portion with an independent journalism fund.',
    images: [ogImage],
  },
  other: {
    'fc:miniapp': JSON.stringify(miniAppEmbed),
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
