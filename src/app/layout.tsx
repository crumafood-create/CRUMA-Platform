import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';

import { AppProvider } from '@/providers/app-provider';

const inter = Inter({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Crumafood',
    template: '%s | Crumafood',
  },
  description:
    'Tequeños, empanadas y productos congelados artesanales.',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="es">
  <body suppressHydrationWarning>
    
    metadataBase: new URL('https://crumafood.com.mx'),
    viewport: {
  width: 'device-width',
  initialScale: 1,
},
    
    <body
  className={inter.className}
  suppressHydrationWarning
>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
