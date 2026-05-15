import { LiveOrdersListener }
from '@/domains/realtime/components/live-orders-listener';

import { LiveInventoryListener }
from '@/domains/realtime/components/live-inventory-listener';

export default function AdminDashboardPage() {

  return (

    <main className="space-y-6">

      <LiveOrdersListener />

      <LiveInventoryListener />

      <h1 className="text-4xl font-bold">

        Dashboard

      </h1>

      <div className="rounded-2xl border p-6">

        Sistema realtime activo

      </div>

    </main>
  );
}
