'use client';

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
  materials: Material[];
}

export function PurchaseOrderItemForm({
  action,
  purchaseOrderId,
  materials,
}: Props) {
  return (
    <form
      action={action}
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
          defaultValue=""
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
          type="number"
          step="0.0001"
          min="0.0001"
          name="quantity"
          required
          className="w-full rounded border p-3"
        />
      </div>

      <div>
        <label className="mb-2 block font-medium">
          Costo Unitario
        </label>

        <input
          type="number"
          step="0.0001"
          min="0"
          name="unit_cost"
          required
          className="w-full rounded border p-3"
        />
      </div>

      <button
        type="submit"
        className="rounded border px-6 py-2"
      >
        Agregar
      </button>
    </form>
  );
}
