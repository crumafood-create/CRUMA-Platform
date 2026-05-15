import type { ReactNode }
from 'react';

import { StoreNavbar }
from '@/shared/components/store-navbar';

export default function StorefrontLayout({
  children
}: {
  children: ReactNode;
}) {

  return (

    <div>

      <StoreNavbar />

      <main>

        {children}

      </main>

    </div>
  );
}
