'use client';

interface AvailableLot {
  id: string;
  materialName: string;
  lotNumber: string;
  locationName: string;
  availableQuantity: number;
  unitName: string;
}

interface Props {
  action: (formData: FormData) => Promise<void>;
  lots: AvailableLot[];
}

export function RawMaterialLotAdjustmentForm({ action, lots }: Props) {
  return (
    <form action={action} className="space-y-6 rounded-2xl border bg-white p-6">
      <div>
        <label htmlFor="lot_id" className="mb-2 block font-medium">Lote y ubicación</label>
        <select id="lot_id" name="lot_id" required className="w-full rounded border p-3">
          <option value="">Seleccionar lote</option>
          {lots.map((lot) => (
            <option key={lot.id} value={lot.id}>
              {`${lot.materialName} · Lote ${lot.lotNumber} · ${lot.locationName} · ${lot.availableQuantity} ${lot.unitName}`}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="movement_type" className="mb-2 block font-medium">Operación</label>
        <select id="movement_type" name="movement_type" required className="w-full rounded border p-3">
          <option value="entry">Aumentar</option>
          <option value="exit">Disminuir</option>
        </select>
      </div>
      <div>
        <label htmlFor="quantity" className="mb-2 block font-medium">Cantidad (unidad base)</label>
        <input id="quantity" type="number" name="quantity" min="0.0001" step="0.0001" required className="w-full rounded border p-3" />
      </div>
      <div>
        <label htmlFor="reason" className="mb-2 block font-medium">Motivo</label>
        <textarea id="reason" name="reason" required rows={3} className="w-full rounded border p-3" />
      </div>
      <button type="submit" className="rounded-lg border bg-blue-50 px-6 py-3 font-medium text-blue-700 hover:bg-blue-100">
        Guardar ajuste
      </button>
    </form>
  );
}
