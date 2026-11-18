import Link from 'next/link';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';
import { Button } from '@/shared/ui/primitives/button';
import { Card, CardContent } from '@/shared/ui/primitives/card';

import { recordCheeseCutAction, recordCheeseGratingAction } from './actions';

interface Unit {
  code: string;
  name: string;
}

interface Material {
  id: string;
  name: string;
  unit_of_measure_id: string | null;
  units_of_measure: Unit | Unit[] | null;
}

interface Lot {
  id: string;
  raw_material_id: string;
  lot_number: string;
  quantity: number;
  unit_cost: number;
  expiration_date: string | null;
  inventory_location_id: string | null;
}

interface PreparationOperation {
  id: string;
  operation_type: 'cut' | 'grate';
  stick_presentation: 'party' | 'traditional' | null;
  source_lot_id: string;
  source_quantity: number;
  source_cost: number;
  output_lot_id: string | null;
  output_quantity: number;
  output_weight_kg: number;
  output_cost: number;
  secondary_lot_id: string | null;
  secondary_quantity: number;
  secondary_cost: number;
  waste_quantity: number;
  waste_cost: number;
  unexplained_quantity: number;
  unexplained_cost: number;
  piece_count: number | null;
  reason: string;
  created_at: string;
}

function unitOf(material: Material): Unit | null {
  const unit = material.units_of_measure;
  return Array.isArray(unit) ? unit[0] ?? null : unit;
}

function normalized(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function isMassUnit(material: Material): boolean {
  return unitOf(material)?.code === 'kg';
}

function materialOptions(materials: Material[], predicate: (material: Material) => boolean) {
  return materials.filter(predicate).map((material) => (
    <option key={material.id} value={material.id}>
      {material.name} · {unitOf(material)?.name ?? 'unidad sin identificar'}
    </option>
  ));
}

export default async function CheesePreparationPage({
  searchParams,
}: {
  searchParams: Promise<{ cut?: string; grate?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createTypedClient();
  const [materialsResult, lotsResult] = await Promise.all([
    supabase.from('raw_materials')
      .select('id, name, unit_of_measure_id, units_of_measure(code, name)')
      .eq('is_active', true).is('deleted_at', null).order('name'),
    supabase.from('raw_material_lots')
      .select('id, raw_material_id, lot_number, quantity, unit_cost, expiration_date, inventory_location_id')
      .eq('status', 'available').gt('quantity', 0).order('expiration_date', { ascending: true, nullsFirst: false }),
  ]);
  if (materialsResult.error) throw new Error('No fue posible cargar las materias primas.');
  if (lotsResult.error) throw new Error('No fue posible cargar los lotes de materias primas.');
  const materials = (materialsResult.data ?? []) as unknown as Material[];
  const lots = (lotsResult.data ?? []) as Lot[];
  const materialById = new Map(materials.map((material) => [material.id, material]));
  const sourceLots = lots.filter((lot) => {
    const name = normalized(materialById.get(lot.raw_material_id)?.name ?? '');
    return isMassUnit(materialById.get(lot.raw_material_id) ?? { id: '', name: '', unit_of_measure_id: null, units_of_measure: null })
      && name.includes('queso') && !name.includes('recorte') && !name.includes('rallado');
  });
  const trimLots = lots.filter((lot) => {
    const name = normalized(materialById.get(lot.raw_material_id)?.name ?? '');
    return isMassUnit(materialById.get(lot.raw_material_id) ?? { id: '', name: '', unit_of_measure_id: null, units_of_measure: null })
      && name.includes('recorte') && name.includes('queso');
  });
  const availableMaterials = materials.filter((material) => material.unit_of_measure_id !== null);
  const itemQueryClient = supabase as unknown as {
    from: (table: 'cheese_preparation_operations') => {
      select: (columns: string) => {
        order: (column: 'created_at', options: { ascending: false }) => Promise<{
          data: PreparationOperation[] | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
  const operationsResult = await itemQueryClient.from('cheese_preparation_operations')
    .select('id, operation_type, stick_presentation, source_lot_id, source_quantity, source_cost, output_lot_id, output_quantity, output_weight_kg, output_cost, secondary_lot_id, secondary_quantity, secondary_cost, waste_quantity, waste_cost, unexplained_quantity, unexplained_cost, piece_count, reason, created_at')
    .order('created_at', { ascending: false });
  if (operationsResult.error) throw new Error('No fue posible consultar las preparaciones de queso.');
  const operations = operationsResult.data ?? [];
  const traceLotIds = [...new Set(operations.flatMap((operation) => [
    operation.source_lot_id,
    operation.output_lot_id,
    operation.secondary_lot_id,
  ]).filter((id): id is string => id !== null))];
  const traceLotsResult = traceLotIds.length
    ? await supabase.from('raw_material_lots')
      .select('id, lot_number, raw_material_id')
      .in('id', traceLotIds)
    : { data: [], error: null };
  if (traceLotsResult.error) throw new Error('No fue posible cargar la trazabilidad de los lotes.');
  const traceLotById = new Map((traceLotsResult.data ?? []).map((lot) => [lot.id, lot]));

  return (
    <main className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-blue">Producción</p>
          <h1 className="mt-2 text-3xl font-black text-brand-black">Preparación de queso</h1>
          <p className="mt-1 text-sm text-brand-gray-75">Corta palitos por tamaño y ralla recortes aprovechables con trazabilidad y costo por lote.</p>
        </div>
        <Link href="/production-orders"><Button variant="outline">Volver a producción</Button></Link>
      </header>

      {params.cut || params.grate ? (
        <p role="status" className="rounded-lg border border-green-300 bg-green-50 p-3 text-green-900">
          Preparación registrada. La operación y sus movimientos son idempotentes por solicitud.
        </p>
      ) : null}
      <p className="rounded-lg border bg-white p-4 text-sm">
        Las materias primas de salida deben existir en el catálogo con unidad base correcta: Palitos de queso Party (pza), Palitos de queso tradicionales (pza), Recorte de queso para rallar (kg) y Queso rallado (kg). Selecciona la existencia que corresponde a cada salida.
        {' '}<Link className="font-semibold underline" href="/raw-materials">Abrir Materias Primas</Link>
      </p>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 p-6">
            <h2 className="text-xl font-bold">Corte de queso</h2>
            <p className="text-sm text-brand-gray-75">Registra los pesos reales. El recorte y la merma quedan separados; cualquier diferencia sin asignar se muestra en el historial.</p>
            <form action={recordCheeseCutAction} className="space-y-4">
              <input type="hidden" name="idempotency_key" value={crypto.randomUUID()} />
              <label className="block space-y-1 text-sm font-medium">Lote de queso · kg
                <select name="source_lot_id" required className="w-full rounded border p-3">
                  <option value="">Seleccionar lote disponible</option>
                  {sourceLots.map((lot) => <option key={lot.id} value={lot.id}>{materialById.get(lot.raw_material_id)?.name} · {lot.lot_number} · {Number(lot.quantity).toFixed(4)} kg · ${Number(lot.unit_cost).toFixed(4)}/kg</option>)}
                </select>
              </label>
              <label className="block space-y-1 text-sm font-medium">Presentación de palito
                <select name="presentation" required className="w-full rounded border p-3">
                  <option value="">Seleccionar</option><option value="party">Party</option><option value="traditional">Tradicional</option>
                </select>
              </label>
              <label className="block space-y-1 text-sm font-medium">Existencia de salida · palitos en piezas
                <select name="stick_material_id" required className="w-full rounded border p-3">
                  <option value="">Seleccionar la materia prima de palitos</option>
                  {materialOptions(availableMaterials, (material) => ['pza', 'pieza'].includes(unitOf(material)?.code ?? '') && normalized(material.name).includes('palito'))}
                </select>
              </label>
              <label className="block space-y-1 text-sm font-medium">Existencia de recorte · kg
                <select name="trim_material_id" required className="w-full rounded border p-3">
                  <option value="">Seleccionar la materia prima de recorte</option>
                  {materialOptions(availableMaterials, (material) => isMassUnit(material) && normalized(material.name).includes('recorte'))}
                </select>
              </label>
              <label className="block space-y-1 text-sm font-medium">Peso de queso retirado (kg)
                <input name="source_quantity_kg" type="number" min="0.0001" step="0.0001" required className="w-full rounded border p-3" />
              </label>
              <label className="block space-y-1 text-sm font-medium">Cantidad de palitos obtenidos
                <input name="piece_count" type="number" min="1" step="1" required className="w-full rounded border p-3" />
              </label>
              <label className="block space-y-1 text-sm font-medium">Peso total real de los palitos (kg)
                <input name="stick_weight_kg" type="number" min="0.0001" step="0.0001" required className="w-full rounded border p-3" />
              </label>
              <label className="block space-y-1 text-sm font-medium">Peso del recorte aprovechable (kg)
                <input name="trim_weight_kg" type="number" min="0" step="0.0001" defaultValue="0" required className="w-full rounded border p-3" />
              </label>
              <label className="block space-y-1 text-sm font-medium">Merma de corte medida (kg)
                <input name="waste_weight_kg" type="number" min="0" step="0.0001" defaultValue="0" required className="w-full rounded border p-3" />
              </label>
              <label className="block space-y-1 text-sm font-medium">Motivo / referencia de preparación
                <textarea name="reason" required maxLength={500} rows={2} className="w-full rounded border p-3" />
              </label>
              <Button type="submit">Registrar corte</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            <h2 className="text-xl font-bold">Rallado de recorte</h2>
            <p className="text-sm text-brand-gray-75">Consume un lote de recorte y registra el peso rallado y la merma por separado.</p>
            <form action={recordCheeseGratingAction} className="space-y-4">
              <input type="hidden" name="idempotency_key" value={crypto.randomUUID()} />
              <label className="block space-y-1 text-sm font-medium">Lote de recorte de queso · kg
                <select name="trim_lot_id" required className="w-full rounded border p-3">
                  <option value="">Seleccionar recorte disponible</option>
                  {trimLots.map((lot) => <option key={lot.id} value={lot.id}>{materialById.get(lot.raw_material_id)?.name} · {lot.lot_number} · {Number(lot.quantity).toFixed(4)} kg · ${Number(lot.unit_cost).toFixed(4)}/kg</option>)}
                </select>
              </label>
              <label className="block space-y-1 text-sm font-medium">Existencia de salida · queso rallado en kg
                <select name="grated_material_id" required className="w-full rounded border p-3">
                  <option value="">Seleccionar la materia prima de queso rallado</option>
                  {materialOptions(availableMaterials, (material) => isMassUnit(material) && normalized(material.name).includes('queso') && normalized(material.name).includes('rallado'))}
                </select>
              </label>
              <label className="block space-y-1 text-sm font-medium">Peso de recorte retirado (kg)
                <input name="source_quantity_kg" type="number" min="0.0001" step="0.0001" required className="w-full rounded border p-3" />
              </label>
              <label className="block space-y-1 text-sm font-medium">Peso obtenido de queso rallado (kg)
                <input name="grated_weight_kg" type="number" min="0.0001" step="0.0001" required className="w-full rounded border p-3" />
              </label>
              <label className="block space-y-1 text-sm font-medium">Merma de rallado medida (kg)
                <input name="waste_weight_kg" type="number" min="0" step="0.0001" defaultValue="0" required className="w-full rounded border p-3" />
              </label>
              <label className="block space-y-1 text-sm font-medium">Motivo / referencia de preparación
                <textarea name="reason" required maxLength={500} rows={2} className="w-full rounded border p-3" />
              </label>
              <Button type="submit">Registrar rallado</Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Historial y trazabilidad</h2>
        {operations.length === 0 ? <p className="rounded-lg border bg-white p-4 text-sm">Aún no hay operaciones de preparación registradas.</p> : (
          <div className="space-y-3">
            {operations.map((operation) => (
              <article key={operation.id} className="space-y-2 rounded-xl border bg-white p-4 text-sm">
                <h3 className="font-bold">{operation.operation_type === 'cut' ? `Corte ${operation.stick_presentation === 'party' ? 'Party' : 'tradicional'}` : 'Rallado de recorte'} · {new Date(operation.created_at).toLocaleString('es-MX')}</h3>
                <p>Origen: {traceLotById.get(operation.source_lot_id)?.lot_number ?? operation.source_lot_id} · {Number(operation.source_quantity).toFixed(4)} kg · costo asignado ${Number(operation.source_cost).toFixed(4)}</p>
                <p>Salida: {traceLotById.get(operation.output_lot_id ?? '')?.lot_number ?? 'sin lote'} · {operation.piece_count ? `${operation.piece_count} piezas, ${Number(operation.output_weight_kg).toFixed(4)} kg` : `${Number(operation.output_weight_kg).toFixed(4)} kg`} · costo ${Number(operation.output_cost).toFixed(4)}</p>
                {operation.secondary_lot_id ? <p>Recorte: {traceLotById.get(operation.secondary_lot_id)?.lot_number ?? operation.secondary_lot_id} · {Number(operation.secondary_quantity).toFixed(4)} kg · costo ${Number(operation.secondary_cost).toFixed(4)}</p> : null}
                <p>Merma: {Number(operation.waste_quantity).toFixed(4)} kg · costo ${Number(operation.waste_cost).toFixed(4)}</p>
                {Number(operation.unexplained_quantity) > 0 ? <p className="font-semibold text-amber-800">Diferencia sin explicar: {Number(operation.unexplained_quantity).toFixed(4)} kg · costo ${Number(operation.unexplained_cost).toFixed(4)}</p> : null}
                <p>Referencia: {operation.reason}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
