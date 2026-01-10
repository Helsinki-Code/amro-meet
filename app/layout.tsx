import '../styles/globals.css';
import '@livekit/components-styles';
import '@livekit/components-styles/prefabs';
import type { Metadata, Viewport } from 'next';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: {
    default: 'AmroMeet | Conference app',
    template: '%s',
  },
  description:
    'AmroMeet is an open source WebRTC project that gives you everything needed to build scalable and real-time audio and/or video experiences in your applications.',
  twitter: {
    card: 'summary_large_image',
    images: ['/images/intro.png'],
  },
  openGraph: {
    siteName: 'AmroMeet',
    images: [
      {
        url: '/images/intro.png',
        width: 1200,
        height: 630,
        alt: 'AmroMeet',
      },
    ],
  },
  icons: {
    icon: {
      rel: 'icon',
      url: '/favicon.ico',
    },
    apple: [
      {
        rel: 'apple-touch-icon',
        url: '/images/amro-meet-logo.png',
        sizes: '180x180',
      },
      { rel: 'mask-icon', url: '/images/icon.png', color: '#050507' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#050507',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body data-lk-theme="default">
        <Toaster />
        {children}
      </body>
    </html>
  );
}
