import type { ReactNode } from 'react';

import { redirect } from 'next/navigation';

import { getUser }
from '@/domains/auth/services/get-user';

export default async function AdminLayout({
  children
}: {
  children: ReactNode;
}) {

  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  return (

    <div>

      <aside>
        Sidebar
      </aside>

      <main>
        {children}
      </main>

    </div>
  );
}
