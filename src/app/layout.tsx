import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Merdeka 81 — Aplikasi Perayaan HUT RI ke-81',
  description: 'Platform partisipasi perayaan HUT RI ke-81 dengan fitur Twibbon Photobooth, Peta QR Hunt, Wall of Merdeka, & Live Salute.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#D9272D',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={plusJakartaSans.variable}>
      <body className="pb-20 sm:pb-0 font-sans">
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 py-6">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
