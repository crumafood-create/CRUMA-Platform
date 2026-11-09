'use client';

import { type FormEvent, useEffect, useRef, useState } from 'react';

interface Material {
  id: string;
  name: string;
  internal_code: string | null;
  base_unit_label?: string;
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
  presentation_mode: 'base_unit' | 'sealed_package';
  quantity: string;
  base_quantity_per_presentation: string;
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
    presentation_mode: 'base_unit',
    quantity: '',
    base_quantity_per_presentation: '1',
    unit_cost: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasUserEdited = useRef(false);
  const submissionInProgress = useRef(false);
  const storageKey = userId ? getCaptureKey(userId, purchaseOrderId) : null;
  const selectedMaterial = materials.find((material) => material.id === capture.raw_material_id);
  const purchaseQuantity = Number(capture.quantity);
  const purchaseUnitPrice = Number(capture.unit_cost);
  const baseQuantityPerPresentation = capture.presentation_mode === 'base_unit'
    ? 1
    : Number(capture.base_quantity_per_presentation);
  const productAmount = Number.isFinite(purchaseQuantity) && purchaseQuantity > 0
    && Number.isFinite(purchaseUnitPrice) && purchaseUnitPrice >= 0
    ? (purchaseQuantity * purchaseUnitPrice).toFixed(4)
    : null;
  const equivalentBaseUnitPrice = Number.isFinite(baseQuantityPerPresentation)
    && baseQuantityPerPresentation > 0
    && Number.isFinite(purchaseUnitPrice) && purchaseUnitPrice >= 0
    ? (purchaseUnitPrice / baseQuantityPerPresentation).toFixed(4)
    : null;

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
        presentation_mode: parsed.presentation_mode === 'sealed_package' ? 'sealed_package' : 'base_unit',
        quantity: parsed.quantity,
        base_quantity_per_presentation:
          typeof parsed.base_quantity_per_presentation === 'string'
            ? parsed.base_quantity_per_presentation
            : '1',
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
    setCapture({
      raw_material_id: '',
      presentation_mode: 'base_unit',
      quantity: '',
      base_quantity_per_presentation: '1',
      unit_cost: '',
    });
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
      setCapture({
        raw_material_id: '',
        presentation_mode: 'base_unit',
        quantity: '',
        base_quantity_per_presentation: '1',
        unit_cost: '',
      });
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
        <label htmlFor="purchase-order-material" className="mb-2 block font-medium">
          Materia Prima
        </label>

        <select
          id="purchase-order-material"
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
        <label htmlFor="purchase-presentation-mode" className="mb-2 block font-medium">
          Presentación de compra
        </label>
        <select
          id="purchase-presentation-mode"
          name="presentation_mode"
          required
          className="w-full rounded border p-3"
          value={capture.presentation_mode}
          onChange={(event) => updateCapture(
            'presentation_mode',
            event.target.value as PendingCapture['presentation_mode'],
          )}
        >
          <option value="base_unit">Unidad base</option>
          <option value="sealed_package">Presentación cerrada</option>
        </select>
      </div>

      <div>
        <label htmlFor="purchase-quantity" className="mb-2 block font-medium">
          {capture.presentation_mode === 'base_unit'
            ? `Cantidad (${selectedMaterial?.base_unit_label ?? 'unidad base'})`
            : 'Cantidad de presentaciones'}
        </label>

        <input
          id="purchase-quantity"
          type="text"
          inputMode={capture.presentation_mode === 'base_unit' ? 'decimal' : 'numeric'}
          name="quantity"
          required
          pattern={capture.presentation_mode === 'base_unit' ? undefined : '[0-9]+'}
          className="w-full rounded border p-3"
          value={capture.quantity}
          onChange={(event) => updateCapture('quantity', event.target.value)}
        />
      </div>

      {capture.presentation_mode === 'sealed_package' ? (
        <div>
          <label htmlFor="purchase-package-content" className="mb-2 block font-medium">
            {`Contenido por presentación (${selectedMaterial?.base_unit_label ?? 'unidad base'})`}
          </label>
          <input
            id="purchase-package-content"
            type="text"
            inputMode="decimal"
            name="base_quantity_per_presentation"
            required
            className="w-full rounded border p-3"
            value={capture.base_quantity_per_presentation}
            onChange={(event) => updateCapture('base_quantity_per_presentation', event.target.value)}
          />
        </div>
      ) : null}

      <div>
        <label htmlFor="purchase-unit-cost" className="mb-2 block font-medium">
          {capture.presentation_mode === 'base_unit'
            ? `Precio por ${selectedMaterial?.base_unit_label ?? 'unidad base'} (MXN)`
            : 'Precio por presentación (MXN)'}
        </label>

        <input
          id="purchase-unit-cost"
          type="text"
          inputMode="decimal"
          name="unit_cost"
          required
          className="w-full rounded border p-3"
          value={capture.unit_cost}
          onChange={(event) => updateCapture('unit_cost', event.target.value)}
        />
      </div>

      <p aria-live="polite" className="text-sm text-gray-700">
        {productAmount === null
          ? 'Importe del producto: pendiente'
          : `Importe del producto: $${productAmount} MXN`}
        {equivalentBaseUnitPrice === null
          ? null
          : ` · Equivalente: $${equivalentBaseUnitPrice} MXN/${selectedMaterial?.base_unit_label ?? 'unidad base'}`}
      </p>

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
