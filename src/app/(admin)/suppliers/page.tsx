import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export default async function SuppliersPage() {
  const supabase =
    await createClient();

  const { data: suppliers } =
    await supabase
      .from('suppliers')
      .select('*')
      .is('deleted_at', null)
      .order('name');

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">
          Proveedores
        </h1>

        <Link
          href="/suppliers/new"
          className="rounded border px-4 py-2"
        >
          Nuevo Proveedor
        </Link>
      </div>

      <div className="rounded-2xl border p-6">
        {suppliers?.length ? (
          <div className="space-y-3">
            {suppliers.map(
              (supplier: any) => (
                <div
                  key={supplier.id}
                  className="rounded border p-4"
                >
                  <div className="font-semibold">
                    {supplier.name}
                  </div>

                  <div className="text-sm text-gray-500">
                    {
                      supplier.contact_name
                    }
                  </div>

                  <div className="text-sm text-gray-500">
                    {supplier.phone}
                  </div>
                </div>
              )
            )}
          </div>
        ) : (
          <p>
            No hay proveedores.
          </p>
        )}
      </div>
    </main>
  );
}
