import { notFound } from 'next/navigation';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';
import { normalizeWarehouseFormValues } from '@/modules/inventory/application/warehouse-contract';

import { WarehouseForm } from '@/app/(admin)/_components/warehouse-form';

import {
  updateWarehouse,
  deleteWarehouse,
} from '../../actions';

export default async function EditWarehousePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createTypedClient();

  const { data: warehouse, error } = await supabase
    .from('warehouses')
    .select('id, name, code, description, is_active')
    .eq('id', id)
    .single();

  if (error || !warehouse) notFound();

  return (
    <main className="space-y-6">
      <h1 className="text-4xl font-bold">
        Editar Almacén
      </h1>

      <WarehouseForm
        initialValues={normalizeWarehouseFormValues(warehouse)}
        action={updateWarehouse.bind(null, warehouse.id)}
      />

      <form action={deleteWarehouse.bind(null, warehouse.id)}>
        <button
          type="submit"
          className="rounded-lg border px-4 py-2"
        >
          Eliminar
        </button>
      </form>
    </main>
  );
}
