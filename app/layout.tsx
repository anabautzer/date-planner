import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Date Planner — um convite',
  description: 'Um convite interativo para alinhar agendas, lugares e filmes.',
};

export const viewport: Viewport = {
  themeColor: '#FBF7F4',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={jakarta.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
