import { releaseProductionOutputToInventory } from '@/app/(admin)/lots/actions';

type Option = { id: string; label: string };
type OutputOption = Option & { productionOrderId: string; quantity: number };

type Props = {
  outputs: OutputOption[];
  warehouses: Option[];
  locations: Option[];
  initialOutputId: string;
};

export function ProductionLotReleaseForm({
  outputs,
  warehouses,
  locations,
  initialOutputId,
}: Props) {
  return (
    <form action={releaseProductionOutputToInventory} className="space-y-5 rounded-2xl border p-6">
      <label className="block text-sm">
        Salida aprobada
        <select name="production_output_id" defaultValue={initialOutputId} required className="mt-1 block w-full rounded border px-3 py-2">
          <option value="">Selecciona una salida</option>
          {outputs.map((output) => (
            <option key={output.id} value={output.id}>
              {output.label} · {output.quantity} unidades
            </option>
          ))}
        </select>
      </label>
      <input
        type="hidden"
        name="production_order_id"
        value={outputs.find((output) => output.id === initialOutputId)?.productionOrderId ?? ''}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm">
          Número de lote
          <input name="lot_number" required maxLength={40} className="mt-1 block w-full rounded border px-3 py-2" />
        </label>
        <label className="text-sm">
          Fecha de caducidad
          <input name="expiration_date" type="date" required className="mt-1 block w-full rounded border px-3 py-2" />
        </label>
        <label className="text-sm">
          Almacén
          <select name="warehouse_id" required className="mt-1 block w-full rounded border px-3 py-2">
            <option value="">Selecciona un almacén</option>
            {warehouses.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label className="text-sm">
          Ubicación
          <select name="inventory_location_id" required className="mt-1 block w-full rounded border px-3 py-2">
            <option value="">Selecciona una ubicación</option>
            {locations.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
      </div>
      <button type="submit" className="rounded border px-4 py-2">
        Liberar lote a inventario
      </button>
    </form>
  );
}
