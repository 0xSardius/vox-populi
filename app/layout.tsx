import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
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

const appUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

// Farcaster Mini App embed configuration
const miniAppEmbed = {
  version: '1',
  imageUrl: `${appUrl}/og-image.svg`,
  button: {
    title: 'Open App',
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
  description: 'Earn yield. Fund journalism. Voice of the people.',
  metadataBase: new URL(appUrl),
  openGraph: {
    title: 'Vox Populi',
    description: 'Earn yield. Fund journalism. Voice of the people.',
    type: 'website',
    images: ['/og-image.svg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vox Populi',
    description: 'Earn yield. Fund journalism. Voice of the people.',
    images: ['/og-image.svg'],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
