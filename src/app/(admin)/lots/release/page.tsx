import Link from 'next/link';

import {
  createTypedClient,
} from '@/infrastructure/integrations/supabase/server';
import {
  ProductionLotReleaseForm,
} from '@/modules/manufacturing/components/forms/production-lot-release-form';

export default async function ReleaseProductionLotPage({
  searchParams,
}: {
  searchParams: Promise<{
    inspection_id?: string;
  }>;
}) {
  const {
    inspection_id: inspectionId,
  } = await searchParams;

  const supabase = await createTypedClient();

  const [
    {
      data: rawInspections,
      error,
    },
    {
      data: warehouses,
    },
    {
      data: locations,
    },
  ] = await Promise.all([
    supabase
      .from('quality_inspections')
      .select(`
        id,
        inspected_at,
        production_outputs!inner (
          id,
          quantity_produced,
          mass_quantity_produced,
          quality_status,
          products (
            name
          ),
          production_orders (
            production_number
          )
        )
      `)
      .eq('subject_type', 'production_output')
      .eq('status', 'passed')
      .eq(
        'production_outputs.quality_status',
        'pending',
      )
      .order('inspected_at'),
    supabase
      .from('warehouses')
      .select('id, name')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('inventory_locations')
      .select('id, name, location_use, storage_condition')
      .eq('is_active', true)
      .is('deleted_at', null)
      .in('location_use', ['finished_product', 'prepared_ingredient'])
      .in('storage_condition', ['refrigerated', 'frozen'])
      .order('name'),
  ]);

  if (error) {
    throw new Error(
      'No fue posible consultar las inspecciones aprobadas.',
    );
  }

  const inspections =
    (rawInspections ?? []).map(
      (inspection) => {
        const output =
          inspection.production_outputs;

        return {
          id: inspection.id,
          quantity: output.mass_quantity_produced
            ?? output.quantity_produced,
          isIntermediateMass:
            output.mass_quantity_produced !== null,
          label:
            `${
              output.production_orders
                ?.production_number ?? '-'
            } · ${
              output.products?.name ?? '-'
            }`,
        };
      },
    );

  const initialInspectionId =
    inspections.some(
      (inspection) =>
        inspection.id === inspectionId,
    )
      ? inspectionId ?? ''
      : '';

  return (
    <main className="space-y-6">
      <div
        className={
          'flex items-center justify-between'
        }
      >
        <div>
          <h1 className="text-4xl font-bold">
            Liberar producto terminado
          </h1>

          <p className="text-sm text-gray-500">
            Registra la decisión, el lote y la
            entrada al inventario en una sola
            operación.
          </p>
        </div>

        <Link
          href="/lots"
          className="rounded border px-4 py-2"
        >
          Volver
        </Link>
      </div>

      {inspections.length ? (
        <ProductionLotReleaseForm
          inspections={inspections}
          warehouses={
            (warehouses ?? []).map(
              (warehouse) => ({
                id: warehouse.id,
                label: warehouse.name,
              }),
            )
          }
          locations={
            (locations ?? []).map(
              (location) => ({
                id: location.id,
                name: location.name,
                label: `${location.name} · ${location.storage_condition === 'refrigerated' ? 'Espera refrigerada' : 'Congelación directa'}`,
                storageCondition: location.storage_condition,
                locationUse: location.location_use,
              }),
            )
          }
          initialInspectionId={
            initialInspectionId
          }
          idempotencyKey={
            crypto.randomUUID()
          }
        />
      ) : (
        <p
          className={
            'rounded border p-6 ' +
            'text-gray-500'
          }
        >
          No hay inspecciones aprobadas pendientes
          de liberación.
        </p>
      )}
    </main>
  );
}
