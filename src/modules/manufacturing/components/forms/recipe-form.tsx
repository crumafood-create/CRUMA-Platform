'use client';

interface Product {
  id: string;
  name: string;
}

interface Unit {
  id: string;
  name: string;
  code: string;
}

interface Props {
  action: (formData: FormData) => Promise<void>;
  products: Product[];
  unitsOfMeasure: Unit[];
  initialValues?: {
    product_id?: string;
    name?: string;
    description?: string;
    yield_quantity?: number;
    unit_of_measure_id?: string;
    is_active?: boolean;
  };
}

export function RecipeForm({
  action,
  products,
  unitsOfMeasure,
  initialValues,
}: Props) {
  return (
    <form
      action={action}
      className="space-y-6 rounded-2xl border bg-white p-6"
    >
      <div>
        <label className="mb-2 block font-medium">
          Producto terminado *
        </label>

        <select
          name="product_id"
          required
          defaultValue={initialValues?.product_id ?? ''}
          className="w-full rounded border p-3"
        >
          <option value="">
            Seleccionar producto
          </option>

          {products.map((product) => (
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
          Nombre *
        </label>

        <input
          name="name"
          required
          defaultValue={initialValues?.name ?? ''}
          className="w-full rounded border p-3"
          placeholder="Receta Tequeños Tradicionales"
        />
      </div>

      <div>
        <label className="mb-2 block font-medium">
          Rendimiento *
        </label>

        <input
          type="number"
          step="0.001"
          min="0.001"
          name="yield_quantity"
          required
          defaultValue={initialValues?.yield_quantity ?? 1}
          className="w-full rounded border p-3"
          placeholder="100"
        />
      </div>

      <div>
        <label className="mb-2 block font-medium">
          Unidad de medida *
        </label>

        <select
          name="unit_of_measure_id"
          required
          className="w-full rounded border p-3"
          defaultValue={initialValues?.unit_of_measure_id ?? ''}
        >
          <option value="">
            Seleccionar unidad
          </option>

          {unitsOfMeasure.map((unit) => (
            <option
              key={unit.id}
              value={unit.id}
            >
              {unit.code} - {unit.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block font-medium">
          Descripción
        </label>

        <textarea
          name="description"
          rows={4}
          className="w-full rounded border p-3"
          defaultValue={initialValues?.description ?? ''}
        />
      </div>

      <div>
        <label className="mb-2 block font-medium">
          Estado
        </label>

        <select
          name="is_active"
          defaultValue={initialValues?.is_active ? 'true' : 'false'}
          className="w-full rounded border p-3"
        >
          <option value="true">Activa</option>
          <option value="false">Inactiva</option>
        </select>
      </div>

      <button
        type="submit"
        className="rounded border px-6 py-2"
      >
        Guardar
      </button>
    </form>
  );
}
