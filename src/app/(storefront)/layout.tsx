import type { ReactNode } from 'react';

import { StorefrontNavbar } from './_components/navigation/storefront-navbar';
import { MobileMenu } from './_components/navigation/mobile-menu';

interface StorefrontLayoutProps {
  children: ReactNode;
}

export default function StorefrontLayout({
  children,
}: StorefrontLayoutProps) {
  return (
    <div className="min-h-screen">
      <StorefrontNavbar />

      <main>
        {children}
      </main>

      <MobileMenu />
    </div>
  );
}
