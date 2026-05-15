import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AppProvider } from '@/providers/app-provider';
import { RealtimeProvider } from '@/domains/realtime/providers/realtime-provider';

const inter = Inter({
  subsets: ['latin']
});

export const metadata = {

  manifest: '/manifest.json',

  title: 'Crumafood',

  description:
    'ERP Ecommerce Platform'
};

export const metadata: Metadata = {
  title: {
    default: 'Crumafood',
    template: '%s | Crumafood'
  },
  description: 'Tequeños, empanadas y productos congelados artesanales.',
  metadataBase: new URL('https://crumafood.com.mx'),
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AppProvider>
          <RealtimeProvider>
            {children}
          </RealtimeProvider>
        </AppProvider>
      </body>
    </html>
  );
}
