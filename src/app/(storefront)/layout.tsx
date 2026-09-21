import type { ReactNode } from 'react';

import { StorefrontShell } from '@/app/(storefront)/_components/storefront/storefront-shell';

export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return <StorefrontShell>{children}</StorefrontShell>;
}
