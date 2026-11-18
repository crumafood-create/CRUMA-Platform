'use client';

import { useState } from 'react';

type Destination = 'returned_to_lot' | 'direct_waste';

type ProductLotQualitySampleDispositionFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  inspectionId: string;
  sampleId: string;
  pendingQuantity: number;
  idempotencyKey: string;
};

export function ProductLotQualitySampleDispositionForm({
  action,
  inspectionId,
  sampleId,
  pendingQuantity,
  idempotencyKey,
}: ProductLotQualitySampleDispositionFormProps) {
  const [destination, setDestination] = useState<Destination>('returned_to_lot');
  const [returnAuthorized, setReturnAuthorized] = useState(false);

  return (
    <form action={action} className="space-y-3 rounded border p-4">
      <input type="hidden" name="quality_inspection_id" value={inspectionId} />
      <input type="hidden" name="quality_sample_id" value={sampleId} />
      <input type="hidden" name="idempotency_key" value={idempotencyKey} />

      <label className="block text-sm">
        Piezas por decidir (máximo {pendingQuantity})
        <input
          name="quantity"
          type="number"
          min="1"
          max={pendingQuantity}
          step="1"
          defaultValue="1"
          required
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </label>

      <label className="block text-sm">
        Destino
        <select
          name="destination"
          required
          value={destination}
          onChange={(event) => {
            setDestination(event.target.value as Destination);
            setReturnAuthorized(false);
          }}
          className="mt-1 w-full rounded border px-3 py-2"
        >
          <option value="returned_to_lot">Devolver al mismo lote</option>
          <option value="direct_waste">Merma directa de Calidad</option>
        </select>
      </label>

      {destination === 'returned_to_lot' ? (
        <label className="flex items-start gap-2 text-sm">
          <input
            name="return_authorized"
            type="checkbox"
            checked={returnAuthorized}
            onChange={(event) => setReturnAuthorized(event.target.checked)}
            className="mt-1"
          />
          <span>
            Calidad autoriza el retorno y verificó que las piezas siguen intactas
            y conservaron las condiciones de higiene y conservación.
          </span>
        </label>
      ) : null}

      <label className="block text-sm">
        Motivo de la decisión
        <textarea
          name="reason"
          required
          maxLength={500}
          className="mt-1 min-h-20 w-full rounded border px-3 py-2"
        />
      </label>

      <button type="submit" className="rounded border px-4 py-2">
        Registrar destino de estas piezas
      </button>
    </form>
  );
}
