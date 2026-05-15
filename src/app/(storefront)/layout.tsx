import type { ReactNode }
from 'react';

import { StoreNavbar }
from '@/shared/components/store-navbar';

import { MobileNavbar }
from '@/shared/components/mobile-navbar';

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

  <MobileNavbar />

      <main>

</div>

    </div>
  );
}
