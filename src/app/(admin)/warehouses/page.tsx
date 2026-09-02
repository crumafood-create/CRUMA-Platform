import Link from 'next/link';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

export default async function WarehousesPage() {
  const supabase = await createTypedClient();

  const { data: warehouses, error } = await supabase
    .from('warehouses')
    .select('id, name, code, description, is_active')
    .order('name');

  if (error) throw new Error('No se pudieron cargar los almacenes.');

  const warehouseList = warehouses ?? [];

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">
          Almacenes
        </h1>

        <Link
          href="/warehouses/new"
          className="rounded-lg border bg-blue-50 px-4 py-2 font-medium text-blue-700 hover:bg-blue-100"
        >
          Nuevo Almacén
        </Link>
      </div>

      <div className="rounded-2xl border p-6">
        {warehouseList.length > 0 ? (
          <div className="space-y-3">
            {warehouseList.map((warehouse) => (
              <div
                key={warehouse.id}
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <div className="font-semibold">
                      {warehouse.name}
                    </div>

                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        warehouse.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {warehouse.is_active
                        ? 'Activo'
                        : 'Inactivo'}
                    </span>
                  </div>

                  <div className="mt-2 text-sm text-gray-500">
                    Código: {warehouse.code}
                  </div>

                  {warehouse.description ? (
                    <div className="mt-1 text-sm text-gray-500">
                      {warehouse.description}
                    </div>
                  ) : null}
                </div>

                <Link
                  href={`/warehouses/${warehouse.id}/edit`}
                  className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                >
                  Editar
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">
            No hay almacenes creados.
          </p>
        )}
      </div>
    </main>
  );
}
