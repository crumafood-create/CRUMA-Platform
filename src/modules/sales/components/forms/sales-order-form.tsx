'use client';

import { Button } from '@/shared/ui/primitives/button';

interface Customer {
  id: string;
  name: string;
}

interface Props {
  action: (
    formData: FormData
  ) => Promise<void>;

  customers: Customer[];
  minDeliveryDate: string;
}

export function SalesOrderForm({
  action,
  customers,
  minDeliveryDate,
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
          aria-describedby="customer-help"
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
        <p id="customer-help" className="mt-1 text-xs text-brand-gray-50">Solo se muestran clientes activos y disponibles para venta.</p>
      </div>

      <div>
        <label className="mb-2 block font-medium">
          Fecha de entrega
        </label>

        <input
          type="date"
          name="delivery_date"
          className="w-full rounded border p-3"
          min={minDeliveryDate}
          aria-describedby="delivery-help"
        />
        <p id="delivery-help" className="mt-1 text-xs text-brand-gray-50">Selecciona hoy o una fecha posterior.</p>
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

      <Button type="submit">Crear pedido</Button>
    </form>
  );
}
