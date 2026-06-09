'use client';

interface Props {
  action: (formData: FormData) => Promise<void>;

  products: {
    id: string;
    name: string;
  }[];

  locations: {
    id: string;
    name: string;
  }[];
}

export function InventoryMovementForm({
  action,
  products,
  locations,
}: Props) {
  return (
    <form
      action={action}
      className="space-y-6 rounded-2xl border p-6"
    >
      <div>
        <label className="mb-2 block font-medium">
          Producto
        </label>

        <select
          name="product_id"
          required
          className="w-full rounded border p-3"
        >
          <option value="">
            Seleccionar producto
          </option>

          {products.map(product => (
            <option
              key={product.id}
              value={product.id}
            >
              {product.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block font-medium">
          Ubicación
        </label>

        <select
          name="location_id"
          required
          className="w-full rounded border p-3"
        >
          <option value="">
            Seleccionar ubicación
          </option>

          {locations.map(location => (
            <option
              key={location.id}
              value={location.id}
            >
              {location.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block font-medium">
          Tipo Movimiento
        </label>

        <select
          name="movement_type"
          required
          className="w-full rounded border p-3"
        >
          <option value="entry">
            Entrada
          </option>

          <option value="exit">
            Salida
          </option>

          <option value="adjustment">
            Ajuste
          </option>
        </select>
      </div>

      <div>
        <label className="mb-2 block font-medium">
          Cantidad
        </label>

        <input
          type="number"
          step="0.01"
          min="0"
          required
          name="quantity"
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
        Registrar Movimiento
      </button>
    </form>
  );
}
