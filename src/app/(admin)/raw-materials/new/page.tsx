import Link from 'next/link';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';
import { fetchRawMaterialFormCatalog } from '@/modules/inventory/application/raw-material-repository';

import { RawMaterialForm } from '@/modules/warehouse/components/forms/raw-material-form';

import { createRawMaterial } from '../actions';

export default async function NewRawMaterialPage({
  searchParams,
}: {
  searchParams: Promise<{
    returnToPurchaseOrderId?: string;
  }>;
}) {
  const { returnToPurchaseOrderId } = await searchParams;
  const supabase = await createTypedClient();
  const { categories, families, unitsOfMeasure } =
    await fetchRawMaterialFormCatalog(supabase);

  return (
    <main className="max-w-5xl space-y-6">
      <h1 className="text-4xl font-bold">
        Nueva Materia Prima
      </h1>

      <Link
        href={returnToPurchaseOrderId
          ? `/purchase-orders/${returnToPurchaseOrderId}/items`
          : '/raw-materials'}
        className="inline-block rounded border px-4 py-2"
      >
        Cancelar
      </Link>

      <RawMaterialForm
        action={createRawMaterial.bind(
          null,
          returnToPurchaseOrderId ?? null,
        )}
        categories={categories}
        families={families}
        unitsOfMeasure={unitsOfMeasure}
      />
    </main>
  );
}
