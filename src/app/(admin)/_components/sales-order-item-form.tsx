'use client';

interface Product {
  id: string;
  name: string;
}

interface Props {
  action: (
    formData: FormData,
  ) => Promise<void;

  salesOrderId: string;

  products: Product[];
}

export function SalesOrderItemForm({
  action,
  salesOrderId,
  products,
}: Props) {
  return (
    <form
      action={action}
      className="space-y-6"
    >
      <input
        type="hidden"
        name="sales_order_id"
        value={salesOrderId}
      />

      <div>
        <label className="mb-2 block font-medium">
          Producto
        </label>

        <select
          name="product_id"
          required
          className="w-full rounded border p-3"
          defaultValue=""
        >
          <option value="">
            Seleccionar producto
          </option>

          {products.map(
            (product) => (
              <option
                key={product.id}
                value={product.id}
              >
                {product.name}
              </option>
            ),
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
          Precio Unitario
        </label>

        <input
          type="number"
          step="0.01"
          min="0"
          name="unit_price"
          required
          className="w-full rounded border p-3"
        />
      </div>

      <button
        type="submit"
        className="rounded border px-6 py-2"
      >
        Agregar Producto
      </button>
    </form>
  );
}
