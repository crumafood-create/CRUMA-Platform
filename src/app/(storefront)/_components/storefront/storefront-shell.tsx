import type { ReactNode } from 'react';

import { StorefrontFooter } from './storefront-footer';
import { StorefrontHeader } from './storefront-header';

export function StorefrontShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fffaf2] text-[#173b2f]">
      <StorefrontHeader />
      <main id="contenido">{children}</main>
      <StorefrontFooter />
    </div>
  );
}
