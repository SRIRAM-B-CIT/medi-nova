import type { Metadata, Viewport } from 'next';
import '@/index.css';

export const metadata: Metadata = {
  title: 'MediNova',
  description: 'AI-powered health monitoring and assistance',
  manifest: '/manifest.json',
  icons: { icon: '/favicon.ico' },
};

export const viewport: Viewport = {
  themeColor: '#3b82f6',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
