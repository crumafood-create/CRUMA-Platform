'use client';

import { type FormEvent, useEffect, useRef, useState } from 'react';

interface Material {
  id: string;
  name: string;
  internal_code: string | null;
}

interface Props {
  action: (
    formData: FormData
  ) => Promise<void>;

  purchaseOrderId: string;
  userId: string | undefined;
  materials: Material[];
  initialMaterialId?: string | undefined;
}

interface PendingCapture {
  raw_material_id: string;
  quantity: string;
  unit_cost: string;
}

function getCaptureKey(userId: string, purchaseOrderId: string) {
  return `cruma:purchase-order-item:${userId}:${purchaseOrderId}`;
}

export function PurchaseOrderItemForm({
  action,
  purchaseOrderId,
  userId,
  materials,
  initialMaterialId,
}: Props) {
  const [capture, setCapture] = useState<PendingCapture>({
    raw_material_id: initialMaterialId ?? '',
    quantity: '',
    unit_cost: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasUserEdited = useRef(false);
  const submissionInProgress = useRef(false);
  const storageKey = userId ? getCaptureKey(userId, purchaseOrderId) : null;

  useEffect(() => {
    if (hasUserEdited.current || !storageKey) return;

    try {
      const saved = sessionStorage.getItem(storageKey);
      if (!saved) return;

      const parsed = JSON.parse(saved) as Partial<PendingCapture>;
      if (
        typeof parsed.raw_material_id !== 'string' ||
        typeof parsed.quantity !== 'string' ||
        typeof parsed.unit_cost !== 'string'
      ) return;

      setCapture({
        raw_material_id: initialMaterialId ?? parsed.raw_material_id,
        quantity: parsed.quantity,
        unit_cost: parsed.unit_cost,
      });
    } catch {
      sessionStorage.removeItem(storageKey);
    }
  }, [initialMaterialId, storageKey]);

  function updateCapture(field: keyof PendingCapture, value: string) {
    hasUserEdited.current = true;
    setError(null);
    setCapture((current) => {
      const next = { ...current, [field]: value };
      if (storageKey) sessionStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }

  function discardCapture() {
    if (storageKey) sessionStorage.removeItem(storageKey);
    hasUserEdited.current = true;
    setError(null);
    setCapture({ raw_material_id: '', quantity: '', unit_cost: '' });
  }

  async function submitCapture(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionInProgress.current) return;

    submissionInProgress.current = true;
    setIsSubmitting(true);
    setError(null);

    try {
      await action(new FormData(event.currentTarget));
      if (storageKey) sessionStorage.removeItem(storageKey);
      setCapture({ raw_material_id: '', quantity: '', unit_cost: '' });
    } catch {
      setError('No fue posible agregar el renglón de compra. Verifica los datos e intenta de nuevo.');
    } finally {
      submissionInProgress.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={submitCapture}
      className="space-y-6 rounded-2xl border bg-white p-6"
    >
      <input
        type="hidden"
        name="purchase_order_id"
        value={purchaseOrderId}
      />

      <div>
        <label className="mb-2 block font-medium">
          Materia Prima
        </label>

        <select
          name="raw_material_id"
          required
          className="w-full rounded border p-3"
          value={capture.raw_material_id}
          onChange={(event) => updateCapture('raw_material_id', event.target.value)}
        >
          <option value="">
            Seleccionar
          </option>

          {materials.map(
            (material) => (
              <option
                key={material.id}
                value={material.id}
              >
                {material.internal_code
                  ? `${material.internal_code} - ${material.name}`
                  : material.name}
              </option>
            )
          )}
        </select>
      </div>

      <div>
        <label className="mb-2 block font-medium">
          Cantidad
        </label>

        <input
          type="text"
          inputMode="decimal"
          name="quantity"
          required
          className="w-full rounded border p-3"
          value={capture.quantity}
          onChange={(event) => updateCapture('quantity', event.target.value)}
        />
      </div>

      <div>
        <label className="mb-2 block font-medium">
          Costo Unitario
        </label>

        <input
          type="text"
          inputMode="decimal"
          name="unit_cost"
          required
          className="w-full rounded border p-3"
          value={capture.unit_cost}
          onChange={(event) => updateCapture('unit_cost', event.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded border px-6 py-2"
      >
        {isSubmitting ? 'Agregando…' : 'Agregar'}
      </button>
      <button
        type="button"
        className="rounded border px-6 py-2"
        onClick={discardCapture}
      >
        Descartar captura
      </button>
      {error ? (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      ) : null}
    </form>
  );
}
