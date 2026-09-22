import '@/app/globals.css';

import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { AppProvider } from '@/shared/providers';

export const metadata: Metadata = {
  metadataBase: new URL('https://crumafood.com.mx'),

  title: {
    default: 'Crumafood',
    template: '%s | Crumafood',
  },

  description:
    'Tequeños, empanadas y productos congelados artesanales.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="font-manrope">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
