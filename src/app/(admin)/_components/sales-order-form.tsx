'use client';

interface Customer {
  id: string;
  name: string;
}

interface Props {
  action: (
    formData: FormData
  ) => Promise<void>;

  customers: Customer[];
}

export function SalesOrderForm({
  action,
  customers,
}: Props) {
  return (
    <form
      action={action}
      className="space-y-6 rounded-2xl border bg-white p-6"
    >
      <div>
        <label className="mb-2 block font-medium">
          Cliente *
        </label>

        <select
          name="customer_id"
          required
          className="w-full rounded border p-3"
          defaultValue=""
        >
          <option value="">
            Seleccionar cliente
          </option>

          {customers.map(
            (customer) => (
              <option
                key={customer.id}
                value={
                  customer.id
                }
              >
                {customer.name}
              </option>
            ),
          )}
        </select>
      </div>

      <div>
        <label className="mb-2 block font-medium">
          Fecha de entrega
        </label>

        <input
          type="date"
          name="delivery_date"
          className="w-full rounded border p-3"
        />
      </div>

      <div>
        <label className="mb-2 block font-medium">
          Notas
        </label>

        <textarea
          name="notes"
          rows={4}
          className="w-full rounded border p-3"
        />
      </div>

      <button
        type="submit"
        className="rounded border px-6 py-2"
      >
        Crear Pedido
      </button>
    </form>
  );
}
