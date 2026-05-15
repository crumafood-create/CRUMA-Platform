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

  <nav className="space-y-4">

    <Link href="/admin">

      Dashboard

    </Link>

    <Link href="/admin/pedidos">

      Pedidos

    </Link>

    <Link href="/admin/pagos">

      Pagos

    </Link>

    <Link href="/admin/inventario">

      Inventario

    </Link>

  </nav>

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
