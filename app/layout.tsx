import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import ScrollProgress from '@/components/ScrollProgress';
import { getNavigation } from '@/lib/content';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });

export const metadata: Metadata = {
  title: 'AZ-204 Studiegids',
  description: 'Studiegids voor het Microsoft Azure AZ-204 Developer Associate certificaat',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const navigation = getNavigation();

  return (
    <html lang="nl" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-50">
        <ScrollProgress />
        {navigation && <Sidebar navigation={navigation} />}
        <main className="lg:pl-70 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
