'use client';

interface Supplier {
  id: string;
  name: string;
}

interface Props {
  action: (
    formData: FormData,
  ) => Promise<void>;

  suppliers: Supplier[];
}

export function PurchaseOrderForm({
  action,
  suppliers,
}: Props) {
  return (
    <form
      action={action}
      className="space-y-6 rounded-2xl border bg-white p-6"
    >
      <div>
        <label className="mb-2 block font-medium">
          Proveedor *
        </label>

        <select
          name="supplier_id"
          required
          className="w-full rounded border p-3"
          defaultValue=""
        >
          <option value="">
            Seleccionar proveedor
          </option>

          {suppliers.map(
            (supplier) => (
              <option
                key={supplier.id}
                value={
                  supplier.id
                }
              >
                {supplier.name}
              </option>
            ),
          )}
        </select>
      </div>

      <div>
        <label className="mb-2 block font-medium">
          Fecha esperada
        </label>

        <input
          type="date"
          name="expected_date"
          className="w-full rounded border p-3"
        />
      </div>

      <div>
        <label className="mb-2 block font-medium">
          Notas
        </label>

        <textarea
          name="notes"
          rows={3}
          className="w-full rounded border p-3"
        />
      </div>

      <button
        type="submit"
        className="rounded border px-6 py-2"
      >
        Crear Compra
      </button>
    </form>
  );
}
