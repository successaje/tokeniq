import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { ClientLayout } from './ClientLayout';

// Initialize the Inter font with required settings
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  adjustFontFallback: false,
  preload: true,
  fallback: ['system-ui', 'sans-serif']
});

// Define CSS variables for the font
const fontVariables = `
  :root {
    --font-sans: ${inter.style.fontFamily};
  }
`;

// Viewport configuration
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'hsl(0, 0%, 100%)' },
    { media: '(prefers-color-scheme: dark)', color: 'hsl(222.2, 84%, 4.9%)' },
  ],
  colorScheme: 'light dark',
};

// Metadata configuration
export const metadata: Metadata = {
  title: {
    default: 'TokenIQ - Token Analytics Platform',
    template: '%s | TokenIQ',
  },
  description: 'Advanced token analytics and insights',
  applicationName: 'TokenIQ',
  manifest: '/site.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TokenIQ',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#000000" />
        <style dangerouslySetInnerHTML={{ __html: fontVariables }} />
      </head>
      <body 
        className={`${inter.variable} font-sans min-h-screen bg-background text-foreground antialiased`}
        suppressHydrationWarning={true}
      >
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}