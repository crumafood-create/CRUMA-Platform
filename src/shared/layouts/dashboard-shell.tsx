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
    <Link href="/admin/analytics">

  Analytics

</Link>
    /admin/inventario

    <Link href="/admin/produccion">

  Producción

</Link>
    /admin/inventario

    <Link href="/admin/logistica">

  Logística

</Link>
    /admin/produccion
<Link href="/admin/tenants">

  Tenants

</Link>/
    
    admin/logistica

    <Link href="/admin/b2b">

  B2B

</Link>

    /admin/tenants

<Link href="/admin/crm">

  CRM

</Link>

/admin/b2b

<Link href="/admin/marketing">

  Marketing

</Link>

/admin/crm

<Link href="/admin/finance">

  Finanzas

</Link>

/admin/marketing

<Link href="/admin/hr">

  HR

</Link>

/admin/finance

<Link href="/admin/dms">

  DMS

</Link>

/admin/hr

<Link href="/admin/procurement">

  Procurement

</Link>

/admin/dms

<Link href="/admin/qa">

  QA

</Link>

/admin/procurement

<Link href="/admin/bi">

  Executive BI

</Link>

/admin/qa

    
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
