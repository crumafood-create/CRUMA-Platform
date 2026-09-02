import Link from 'next/link';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

export default async function SuppliersPage() {
  const supabase = await createTypedClient();

  const { data: suppliers, error } = await supabase
    .from('suppliers')
    .select('id, name, contact_name, phone, is_active')
    .is('deleted_at', null)
    .order('name');

  if (error) throw new Error('No se pudieron cargar los proveedores.');

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
              (supplier) => (
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

                  <Link
                    href={`/suppliers/${supplier.id}/edit`}
                    className="mt-3 inline-block text-sm text-blue-600"
                  >
                    Editar
                  </Link>
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
