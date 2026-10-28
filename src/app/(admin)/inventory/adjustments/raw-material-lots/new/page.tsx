import Link from 'next/link';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';
import { RawMaterialLotAdjustmentForm } from '@/modules/inventory/components/forms/raw-material-lot-adjustment-form';

import { adjustRawMaterialLotQuantity } from '../../actions';

export default async function NewRawMaterialLotAdjustmentPage() {
  const supabase = await createTypedClient();
  const { data: lots, error } = await supabase
    .from('raw_material_lots')
    .select('id, lot_number, quantity, raw_materials!inner(name, units_of_measure(name, code)), inventory_locations(name)')
    .eq('status', 'available')
    .order('lot_number');

  if (error) throw new Error('No fue posible cargar los lotes disponibles.');

  const options = (lots ?? []).map((lot) => ({
    id: lot.id,
    materialName: lot.raw_materials.name,
    lotNumber: lot.lot_number,
    locationName: lot.inventory_locations?.name ?? 'Sin ubicación registrada',
    availableQuantity: lot.quantity,
    unitName: lot.raw_materials.units_of_measure?.code ?? 'unidad base',
  }));

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Ajuste de materia prima por lote</h1>
          <p className="text-sm text-gray-500">La cantidad se captura en la unidad base del material.</p>
        </div>
        <Link href="/inventory/adjustments" className="rounded border px-4 py-2">Volver</Link>
      </div>
      {options.length ? (
        <RawMaterialLotAdjustmentForm action={adjustRawMaterialLotQuantity} lots={options} />
      ) : (
        <p className="rounded-2xl border p-6">No hay lotes disponibles para ajustar.</p>
      )}
    </main>
  );
}
