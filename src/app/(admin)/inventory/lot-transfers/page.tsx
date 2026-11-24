import Link from 'next/link';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

import { transferRawMaterialLotLocation } from './actions';

interface StorageLocation {
  id: string;
  name: string;
  location_use: string | null;
  storage_condition: string | null;
}

interface LotTransferRow {
  id: string;
  lot_number: string;
  quantity: number;
  remaining_value: number;
  status: string;
  storage_condition: string | null;
  inventory_location_id: string | null;
  raw_materials: {
    name: string;
    internal_code: string | null;
    required_storage_condition: string | null;
    default_storage_use: string | null;
    units_of_measure: { code: string } | null;
  } | null;
  inventory_locations: StorageLocation | null;
}

function conditionName(condition: string | null): string {
  if (condition === 'refrigerated') return 'Refrigerado';
  if (condition === 'dry') return 'Seco';
  if (condition === 'frozen') return 'Congelado';
  return 'Sin clasificar';
}

function useName(locationUse: string | null): string {
  if (locationUse === 'raw_material') return 'Materias primas';
  if (locationUse === 'prepared_ingredient') return 'Semielaborados';
  if (locationUse === 'finished_product') return 'Productos terminados';
  if (locationUse === 'packaging') return 'Empaque';
  if (locationUse === 'chemical') return 'Químicos';
  return 'Sin clasificar';
}

function statusName(status: string): string {
  if (status === 'available') return 'Disponible';
  if (status === 'hold') return 'Retenido';
  if (status === 'quarantine') return 'Cuarentena de Calidad';
  return status;
}

export default async function RawMaterialLotTransfersPage({
  searchParams,
}: {
  searchParams: Promise<{ transferred?: string }>;
}) {
  const { transferred } = await searchParams;
  const supabase = await createTypedClient();
  const [lotsResult, locationsResult] = await Promise.all([
    supabase.from('raw_material_lots')
      .select('id, lot_number, quantity, remaining_value, status, storage_condition, inventory_location_id, raw_materials!inner(name, internal_code, required_storage_condition, default_storage_use, units_of_measure(code)), inventory_locations(id, name, location_use, storage_condition)')
      .in('status', ['available', 'hold', 'quarantine'])
      .gt('quantity', 0)
      .order('expiration_date', { ascending: true, nullsFirst: false }),
    supabase.from('inventory_locations')
      .select('id, name, location_use, storage_condition')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('name'),
  ]);
  if (lotsResult.error) throw new Error('No fue posible consultar los lotes para traslado.');
  if (locationsResult.error) throw new Error('No fue posible consultar los destinos configurados.');

  const lots = (lotsResult.data ?? []) as unknown as LotTransferRow[];
  const locations = (locationsResult.data ?? []) as StorageLocation[];

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Traslado de lotes</h1>
          <p className="mt-2 text-sm text-gray-600">
            Cambia la ubicación física sin alterar condición, saldo, valor ni disponibilidad del lote.
          </p>
        </div>
        <Link href="/inventory" className="rounded border px-4 py-2">Volver a inventario</Link>
      </div>

      {transferred === '1' ? (
        <p role="status" className="rounded border border-green-300 bg-green-50 p-3 text-sm">
          Traslado registrado. La cantidad, el valor y el estado del lote se conservaron.
        </p>
      ) : null}

      {lots.length === 0 ? (
        <p className="rounded border p-6 text-center text-gray-600">No hay lotes con saldo para trasladar.</p>
      ) : (
        <div className="space-y-4">
          {lots.map((lot) => {
            const material = lot.raw_materials;
            const source = lot.inventory_locations;
            const expectedCondition = material?.required_storage_condition;
            const expectedUse = material?.default_storage_use;
            const sourceCompatible = Boolean(source && expectedCondition && expectedUse
              && lot.storage_condition === expectedCondition
              && source.storage_condition === expectedCondition
              && source.location_use === expectedUse);
            const destinations = sourceCompatible
              ? locations.filter((location) => location.id !== lot.inventory_location_id
                && location.location_use === expectedUse
                && location.storage_condition === expectedCondition)
              : [];

            return (
              <section key={lot.id} className="space-y-4 rounded-xl border p-5">
                <div>
                  <h2 className="text-lg font-semibold">{material?.name ?? 'Materia prima'} · lote {lot.lot_number}</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    {lot.quantity} {material?.units_of_measure?.code ?? 'unidades'} · valor ${Number(lot.remaining_value).toFixed(4)} · {statusName(lot.status)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Condición: {conditionName(lot.storage_condition)} · origen: {source?.name ?? 'Sin ubicación'}
                    {' · '}{useName(source?.location_use ?? null)}
                  </p>
                </div>

                {!sourceCompatible ? (
                  <p className="rounded bg-amber-50 p-3 text-sm">
                    Traslado bloqueado: el administrador debe clasificar el material y su ubicación actual con el uso y la condición compatibles.
                  </p>
                ) : destinations.length === 0 ? (
                  <p className="rounded bg-amber-50 p-3 text-sm">
                    No hay otro destino activo compatible. Configúralo en Ubicaciones antes de trasladar este lote.
                  </p>
                ) : (
                  <form action={transferRawMaterialLotLocation} className="grid gap-3 md:grid-cols-[1fr_1fr_2fr_auto] md:items-end">
                    <input type="hidden" name="lot_id" value={lot.id} />
                    <input type="hidden" name="idempotency_key" value={crypto.randomUUID()} />
                    <label className="grid gap-1 text-sm">
                      Destino compatible
                      <select name="destination_location_id" required defaultValue="" className="rounded border p-2">
                        <option value="" disabled>Selecciona una ubicación</option>
                        {destinations.map((location) => (
                          <option key={location.id} value={location.id}>
                            {location.name} · {useName(location.location_use)} · {conditionName(location.storage_condition)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <p className="text-sm text-gray-600">
                      Política: {useName(expectedUse ?? null)} · {conditionName(expectedCondition ?? null)}
                    </p>
                    <label className="grid gap-1 text-sm">
                      Motivo
                      <input name="reason" required maxLength={500} className="rounded border p-2" />
                    </label>
                    <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-white">
                      Trasladar
                    </button>
                  </form>
                )}
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
