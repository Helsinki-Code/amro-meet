// app/layout.tsx
import '../styles/globals.css';
import '@livekit/components-styles';
import '@livekit/components-styles/prefabs';
import type { Metadata, Viewport } from 'next';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: {
    default: 'AmroMeet | Professional Video Conferencing',
    template: '%s | AmroMeet',
  },
  description:
    'AmroMeet is a professional-grade video conferencing platform with enterprise security, crystal-clear quality, and seamless collaboration features.',
  twitter: {
    card: 'summary_large_image',
    images: ['/images/intro.png'],
    title: 'AmroMeet - Professional Video Conferencing',
    description: 'Crystal-clear video meetings with enterprise security.',
  },
  openGraph: {
    siteName: 'AmroMeet',
    title: 'AmroMeet - Professional Video Conferencing',
    description: 'Crystal-clear video meetings with enterprise security.',
    images: [
      {
        url: '/images/intro.png',
        width: 1200,
        height: 630,
        alt: 'AmroMeet - Professional Video Conferencing',
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
      { rel: 'mask-icon', url: '/images/icon.png', color: '#6366f1' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#050507',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body data-lk-theme="default">
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(23, 23, 23, 0.95)',
              color: '#fff',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 500,
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}