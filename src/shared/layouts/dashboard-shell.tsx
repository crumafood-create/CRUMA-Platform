import type { ReactNode }
from 'react';

import { AdminNavbar }
from '@/shared/components/admin-navbar';

export function DashboardShell({
  children
}: {
  children: ReactNode;
}) {

  return (

    <div className="flex min-h-screen">

      <aside className="w-64 border-r p-6">

        Sidebar

      </aside>

      <div className="flex-1">

        <AdminNavbar />

        <main className="p-8">

          {children}

        </main>

      </div>

    </div>
  );
}
