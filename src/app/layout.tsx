import './globals.css';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AppProvider } from '@/providers/app-provider';

export const metadata: Metadata = {
  metadataBase: new URL('https://crumafood.com.mx'),

  title: {
    default: 'Crumafood',
    template: '%s | Crumafood',
  },

  description:
    'Tequeños, empanadas y productos congelados artesanales.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="es">
      <body className="font-manrope" suppressHydrationWarning>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
