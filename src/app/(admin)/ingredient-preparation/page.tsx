import Link from 'next/link';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';
import { Button } from '@/shared/ui/primitives/button';
import { Card, CardContent } from '@/shared/ui/primitives/card';

import {
  recordCheeseCutAction,
  recordCheeseGratingAction,
  recordHamGratingAction,
} from './actions';

interface Unit {
  code: string;
  name: string;
}

interface Material {
  id: string;
  name: string;
  internal_code: string | null;
  unit_of_measure_id: string | null;
  units_of_measure: Unit | Unit[] | null;
  required_storage_condition: string | null;
  default_storage_use: string | null;
  default_inventory_location_id: string | null;
}

interface InventoryLocation {
  id: string;
  name: string;
  location_use: string | null;
  storage_condition: string | null;
}

interface Lot {
  id: string;
  raw_material_id: string;
  lot_number: string;
  quantity: number;
  unit_cost: number;
  expiration_date: string | null;
  inventory_location_id: string | null;
  status?: string;
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

function lotStatusLabel(status: string | undefined): string {
  if (status === 'quarantine') return 'Cuarentena de Calidad · no disponible';
  if (status === 'available') return 'Disponible';
  if (status === 'depleted') return 'Agotado';
  return status ?? 'Estado no disponible';
}

function conditionLabel(condition: string | null): string {
  if (condition === 'refrigerated') return 'refrigerado';
  if (condition === 'dry') return 'seco';
  if (condition === 'frozen') return 'congelado';
  return 'sin condición clasificada';
}

function locationUseLabel(use: string | null): string {
  if (use === 'raw_material') return 'materias primas';
  if (use === 'prepared_ingredient') return 'semielaborados';
  if (use === 'finished_product') return 'productos terminados';
  if (use === 'packaging') return 'empaque';
  if (use === 'chemical') return 'químicos';
  return 'sin uso clasificado';
}

function materialDestinationLabel(material: Material, locationById: Map<string, InventoryLocation>): string {
  const location = material.default_inventory_location_id
    ? locationById.get(material.default_inventory_location_id)
    : null;
  if (!material.required_storage_condition || !material.default_storage_use || !location) {
    return 'Destino sin configurar; resolver en Materias Primas.';
  }
  return `${conditionLabel(material.required_storage_condition)} · ${locationUseLabel(material.default_storage_use)} · ${location.name}`;
}

function lotOriginLabel(lot: Lot, locationById: Map<string, InventoryLocation>): string {
  const location = lot.inventory_location_id ? locationById.get(lot.inventory_location_id) : null;
  if (!location) return 'origen sin ubicación clasificada';
  return `${location.name} · ${locationUseLabel(location.location_use)} · ${conditionLabel(location.storage_condition)}`;
}

function materialOptions(
  materials: Material[],
  locationById: Map<string, InventoryLocation>,
  predicate: (material: Material) => boolean,
) {
  return materials.filter(predicate).map((material) => (
    <option key={material.id} value={material.id}>
      {material.name} · {unitOf(material)?.name ?? 'unidad sin identificar'} · destino: {materialDestinationLabel(material, locationById)}
    </option>
  ));
}

export default async function CheesePreparationPage({
  searchParams,
}: {
  searchParams: Promise<{ cut?: string; grate?: string; ham?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createTypedClient();
  const [materialsResult, lotsResult, locationsResult] = await Promise.all([
    supabase.from('raw_materials')
      .select('id, name, internal_code, unit_of_measure_id, required_storage_condition, default_storage_use, default_inventory_location_id, units_of_measure(code, name)')
      .eq('is_active', true).is('deleted_at', null).order('name'),
    supabase.from('raw_material_lots')
      .select('id, raw_material_id, lot_number, quantity, unit_cost, expiration_date, inventory_location_id')
      .eq('status', 'available').gt('quantity', 0).order('expiration_date', { ascending: true, nullsFirst: false }),
    supabase.from('inventory_locations')
      .select('id, name, location_use, storage_condition')
      .eq('is_active', true).is('deleted_at', null),
  ]);
  if (materialsResult.error) throw new Error('No fue posible cargar las materias primas.');
  if (lotsResult.error) throw new Error('No fue posible cargar los lotes de materias primas.');
  if (locationsResult.error) throw new Error('No fue posible consultar las ubicaciones de los lotes.');
  const materials = (materialsResult.data ?? []) as unknown as Material[];
  const lots = (lotsResult.data ?? []) as Lot[];
  const locations = (locationsResult.data ?? []) as InventoryLocation[];
  const locationById = new Map(locations.map((location) => [location.id, location]));
  const materialById = new Map(materials.map((material) => [material.id, material]));
  const sourceLots = lots.filter((lot) => {
    const name = normalized(materialById.get(lot.raw_material_id)?.name ?? '');
    return isMassUnit(materialById.get(lot.raw_material_id) ?? {
      id: '', name: '', internal_code: null, unit_of_measure_id: null, units_of_measure: null,
      required_storage_condition: null, default_storage_use: null, default_inventory_location_id: null,
    })
      && name.includes('queso') && !name.includes('recorte') && !name.includes('rallado');
  });
  const trimLots = lots.filter((lot) => {
    const name = normalized(materialById.get(lot.raw_material_id)?.name ?? '');
    return isMassUnit(materialById.get(lot.raw_material_id) ?? {
      id: '', name: '', internal_code: null, unit_of_measure_id: null, units_of_measure: null,
      required_storage_condition: null, default_storage_use: null, default_inventory_location_id: null,
    })
      && name.includes('recorte') && name.includes('queso');
  });
  const availableMaterials = materials.filter((material) => material.unit_of_measure_id !== null);
  const hamSourceLots = lots.filter((lot) => {
    const material = materialById.get(lot.raw_material_id);
    return material?.internal_code === 'MP-JAMON' && isMassUnit(material);
  });
  const hamGratedMaterial = materials.find((material) =>
    material.internal_code === 'MP-JAM-RALLADO' && isMassUnit(material)) ?? null;
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
      .select('id, lot_number, raw_material_id, status')
      .in('id', traceLotIds)
    : { data: [], error: null };
  if (traceLotsResult.error) throw new Error('No fue posible cargar la trazabilidad de los lotes.');
  const traceLotById = new Map((traceLotsResult.data ?? []).map((lot) => [lot.id, lot]));
  return (
    <main className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-blue">Producción</p>
          <h1 className="mt-2 text-3xl font-black text-brand-black">Preparación de ingredientes</h1>
          <p className="mt-1 max-w-2xl text-sm text-brand-gray-75">Registra por separado los pesos de entrada, el producto aprovechable y la merma. Cada salida conserva su lote de origen y su costo.</p>
        </div>
        <Link href="/production-orders"><Button variant="outline">Volver a producción</Button></Link>
      </header>

      {params.ham ? (
        <p role="status" className="rounded-lg border border-green-300 bg-green-50 p-3 text-green-900">
          Rallado de jamón registrado. El lote está en cuarentena y espera la inspección de Calidad.
        </p>
      ) : params.cut || params.grate ? (
        <p role="status" className="rounded-lg border border-green-300 bg-green-50 p-3 text-green-900">
          Preparación registrada. La operación y sus movimientos son idempotentes por solicitud.
        </p>
      ) : null}
      <aside className="rounded-lg border bg-white p-4 text-sm">
        <h2 className="font-semibold">Antes de empezar</h2>
        <p className="mt-1">Las condiciones y destinos se configuran por material en el catálogo. Aquí se muestran como referencia de solo lectura; una salida preparada queda en cuarentena hasta Calidad y conserva su condición aprobada. Queso y jamón rallados se conservan refrigerados. Las preparaciones de ingredientes no se congelan.</p>
        <ul className="mt-3 space-y-1">
          {materials.filter((material) => ['MP-PAL-QUESO-PARTY', 'MP-PAL-QUESO-TRAD', 'MP-QSO-RECORTE', 'MP-QSO-RALLADO', 'MP-JAM-RALLADO'].includes(material.internal_code ?? '')).map((material) => (
            <li key={material.id}><span className="font-medium">{material.name}:</span> {materialDestinationLabel(material, locationById)}</li>
          ))}
        </ul>
        {' '}<Link className="font-semibold underline" href="/raw-materials">Abrir Materias Primas</Link>
      </aside>

      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold">Preparación de queso</h2>
          <p className="text-sm text-brand-gray-75">Registra primero el corte; el recorte aprovechable puede usarse después en el rallado.</p>
        </div>
        <Card>
          <CardContent className="space-y-4 p-6">
            <h2 className="text-xl font-bold">Corte de queso</h2>
            <p className="text-sm text-brand-gray-75">Registra los pesos reales. El recorte y la merma quedan separados; cualquier diferencia sin asignar se muestra en el historial.</p>
            <form action={recordCheeseCutAction} className="grid gap-4 md:grid-cols-2">
              <input type="hidden" name="idempotency_key" value={crypto.randomUUID()} />
              <label className="block space-y-1 text-sm font-medium md:col-span-2">Lote de queso · kg
                <select name="source_lot_id" required className="w-full rounded border p-3">
                  <option value="">Seleccionar lote disponible</option>
                  {sourceLots.map((lot) => <option key={lot.id} value={lot.id}>{materialById.get(lot.raw_material_id)?.name} · {lot.lot_number} · {Number(lot.quantity).toFixed(4)} kg · {lotOriginLabel(lot, locationById)} · ${Number(lot.unit_cost).toFixed(4)}/kg</option>)}
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
                  {materialOptions(availableMaterials, locationById, (material) => ['pza', 'pieza'].includes(unitOf(material)?.code ?? '') && normalized(material.name).includes('palito'))}
                </select>
              </label>
              <label className="block space-y-1 text-sm font-medium">Existencia de recorte · kg
                <select name="trim_material_id" required className="w-full rounded border p-3">
                  <option value="">Seleccionar la materia prima de recorte</option>
                  {materialOptions(availableMaterials, locationById, (material) => isMassUnit(material) && normalized(material.name).includes('recorte'))}
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
              <Button type="submit" className="md:col-span-2 justify-self-start">Registrar corte de queso</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            <h2 className="text-xl font-bold">Rallado de recorte</h2>
            <p className="text-sm text-brand-gray-75">Consume un lote de recorte y registra el peso rallado y la merma por separado.</p>
            <form action={recordCheeseGratingAction} className="grid gap-4 md:grid-cols-2">
              <input type="hidden" name="idempotency_key" value={crypto.randomUUID()} />
              <label className="block space-y-1 text-sm font-medium md:col-span-2">Lote de recorte de queso · kg
                <select name="trim_lot_id" required className="w-full rounded border p-3">
                  <option value="">Seleccionar recorte disponible</option>
                  {trimLots.map((lot) => <option key={lot.id} value={lot.id}>{materialById.get(lot.raw_material_id)?.name} · {lot.lot_number} · {Number(lot.quantity).toFixed(4)} kg · ${Number(lot.unit_cost).toFixed(4)}/kg</option>)}
                </select>
              </label>
              <label className="block space-y-1 text-sm font-medium">Existencia de salida · queso rallado en kg
                <select name="grated_material_id" required className="w-full rounded border p-3">
                  <option value="">Seleccionar la materia prima de queso rallado</option>
                  {materialOptions(availableMaterials, locationById, (material) => isMassUnit(material) && normalized(material.name).includes('queso') && normalized(material.name).includes('rallado'))}
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
              <Button type="submit" className="md:col-span-2 justify-self-start">Registrar rallado de recorte</Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold">Preparación de jamón</h2>
          <p className="text-sm text-brand-gray-75">La condición y el destino habitual del jamón rallado se consultan en la configuración del material y no se eligen durante la preparación. El lote queda en cuarentena hasta Calidad; los ingredientes preparados no se congelan.</p>
        </div>
        <Card>
          <CardContent className="space-y-4 p-6">
            <h2 className="text-xl font-bold">Rallado de jamón</h2>
            <p className="text-sm text-brand-gray-75">Registra el peso de entrada, el jamón rallado aprovechable y la merma. El lote de salida queda en cuarentena hasta su revisión de Calidad.</p>
            {hamSourceLots.length === 0 || !hamGratedMaterial ? (
              <p className="rounded border bg-amber-50 p-3 text-sm">Para registrar el rallado deben existir Jamón (MP-JAMON) y Jamón rallado (MP-JAM-RALLADO), ambos en kg.</p>
            ) : (
              <form action={recordHamGratingAction} className="grid gap-4 md:grid-cols-2">
                <input type="hidden" name="ham_idempotency_key" value={crypto.randomUUID()} />
                <label className="block space-y-1 text-sm font-medium md:col-span-2">Lote de jamón · kg
                  <select name="ham_source_lot_id" required className="w-full rounded border p-3">
                    <option value="">Seleccionar lote disponible</option>
                    {hamSourceLots.map((lot) => <option key={lot.id} value={lot.id}>{materialById.get(lot.raw_material_id)?.name} · {lot.lot_number} · {Number(lot.quantity).toFixed(4)} kg · {lotOriginLabel(lot, locationById)} · ${Number(lot.unit_cost).toFixed(4)}/kg</option>)}
                  </select>
                </label>
                <input type="hidden" name="ham_grated_material_id" value={hamGratedMaterial.id} />
                <p className="text-sm">Salida: {hamGratedMaterial.name} · {unitOf(hamGratedMaterial)?.name ?? 'kg'} · destino: {materialDestinationLabel(hamGratedMaterial, locationById)}</p>
                <label className="block space-y-1 text-sm font-medium">Peso de jamón retirado (kg)
                  <input name="ham_source_quantity_kg" type="number" min="0.0001" step="0.0001" required className="w-full rounded border p-3" />
                </label>
                <label className="block space-y-1 text-sm font-medium">Peso de jamón rallado aprovechable (kg)
                  <input name="ham_grated_weight_kg" type="number" min="0.0001" step="0.0001" required className="w-full rounded border p-3" />
                </label>
                <label className="block space-y-1 text-sm font-medium">Merma de rallado medida (kg)
                  <input name="ham_waste_weight_kg" type="number" min="0" step="0.0001" defaultValue="0" required className="w-full rounded border p-3" />
                </label>
                <label className="block space-y-1 text-sm font-medium">Motivo / referencia
                  <textarea name="ham_reason" required maxLength={500} rows={2} className="w-full rounded border p-3" />
                </label>
                <Button type="submit" className="md:col-span-2 justify-self-start">Registrar rallado de jamón</Button>
              </form>
            )}
          </CardContent>
        </Card>

      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-2xl font-bold">Historial y trazabilidad</h2>
          <p className="text-sm text-brand-gray-75">Consulta cantidades, costos, mermas y estado de cada lote resultante.</p>
        </div>
        {operations.length === 0 ? <p className="rounded-lg border bg-white p-4 text-sm">Aún no hay operaciones de preparación registradas.</p> : (
          <div className="space-y-3">
            {operations.map((operation) => (
              <article key={operation.id} className="space-y-2 rounded-xl border bg-white p-4 text-sm">
                <h3 className="font-bold">{operation.operation_type === 'cut' ? `Corte ${operation.stick_presentation === 'party' ? 'Party' : 'tradicional'}` : (materialById.get(traceLotById.get(operation.source_lot_id)?.raw_material_id ?? '')?.internal_code === 'MP-JAMON' ? 'Rallado de jamón' : 'Rallado de recorte')} · {new Date(operation.created_at).toLocaleString('es-MX')}</h3>
                <p>Origen: {traceLotById.get(operation.source_lot_id)?.lot_number ?? operation.source_lot_id} · {Number(operation.source_quantity).toFixed(4)} kg · costo asignado ${Number(operation.source_cost).toFixed(4)}</p>
                <p>Salida: {traceLotById.get(operation.output_lot_id ?? '')?.lot_number ?? 'sin lote'} · {operation.piece_count ? `${operation.piece_count} piezas, ${Number(operation.output_weight_kg).toFixed(4)} kg` : `${Number(operation.output_weight_kg).toFixed(4)} kg`} · costo ${Number(operation.output_cost).toFixed(4)} · {lotStatusLabel(traceLotById.get(operation.output_lot_id ?? '')?.status)}</p>
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

