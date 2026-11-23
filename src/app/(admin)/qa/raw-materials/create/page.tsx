import Link from 'next/link';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';
import {
  RawMaterialQualityInspectionForm,
} from '@/modules/quality/components/forms/raw-material-quality-inspection-form';

export default async function CreateRawMaterialQualityInspectionPage({
  searchParams,
}: {
  searchParams: Promise<{
    raw_material_lot_id?: string;
  }>;
}) {
  const {
    raw_material_lot_id: rawMaterialLotId,
  } = await searchParams;

  const supabase = await createTypedClient();

  let query = supabase
    .from('raw_material_lots')
    .select(`
      id,
      lot_number,
      quantity,
      expiration_date,
      status,
      raw_materials (
        name,
        internal_code
      ),
      inventory_locations (
        name
      )
    `)
    .in('status', ['quarantine', 'hold'])
    .gt('quantity', 0)
    .order('expiration_date', {
      ascending: true,
      nullsFirst: false,
    })
    .order('created_at', {
      ascending: true,
    });

  if (rawMaterialLotId) {
    query = query.eq('id', rawMaterialLotId);
  }

  const { data: lots, error } = await query;

  if (error) {
    throw new Error(
      'No fue posible consultar los lotes pendientes de calidad.',
    );
  }

  const lotRows = lots ?? [];
  const lotIds = lotRows.map((lot) => lot.id);
  const preparationResult = lotIds.length
    ? await supabase.from('cheese_preparation_operations')
      .select('operation_type, output_lot_id, secondary_lot_id')
      .or(`output_lot_id.in.(${lotIds.join(',')}),secondary_lot_id.in.(${lotIds.join(',')})`)
    : { data: [], error: null };
  if (preparationResult.error) {
    throw new Error('No fue posible identificar los lotes preparados.');
  }
  const preparedLotIds = new Set((preparationResult.data ?? []).flatMap((operation) => [
    operation.output_lot_id,
    operation.secondary_lot_id,
  ]).filter((id): id is string => id !== null));

  const options = lotRows.map((lot) => {
    const materialCode =
      lot.raw_materials?.internal_code
        ? ` (${lot.raw_materials.internal_code})`
        : '';

    const status =
      lot.status === 'hold'
        ? 'Retenido'
        : 'Cuarentena';

    const expiration =
      lot.expiration_date ?? 'Sin caducidad';

    const location =
      lot.inventory_locations?.name ??
      'Sin ubicación';

    return {
      id: lot.id,
      quantity: Number(lot.quantity),
      label:
        `${lot.raw_materials?.name ?? 'Materia prima'}${materialCode}` +
        ` · lote ${lot.lot_number}` +
        ` · ${status}` +
        ` · ${location}` +
        (preparedLotIds.has(lot.id) ? ' · Preparación: requiere condición y caducidad de Calidad' : '') +
        ` · cad. ${expiration}`,
    };
  });

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            Inspección de materia prima
          </h1>

          <p className="text-sm text-gray-500">
            Inspecciona materias primas recibidas y lotes preparados en cuarentena o retenidos.
          </p>
        </div>

        <Link
          href="/qa"
          className="rounded border px-4 py-2"
        >
          Volver
        </Link>
      </div>

      {options.length > 0 ? (
        <RawMaterialQualityInspectionForm
          lots={options}
          initialLotId={
            options.length === 1
              ? options[0]?.id ?? ''
              : ''
          }
        />
      ) : (
        <p className="rounded border p-6 text-gray-500">
          No hay lotes de materia prima pendientes
          de inspección.
        </p>
      )}
    </main>
  );
}
