'use client';

interface RecipeFormProps {
  action: (formData: FormData) => Promise<void>;

  products: {
    id: string;
    name: string;
  }[];
}

export function RecipeForm({
  action,
  products,
}: RecipeFormProps) {
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
        Guardar Receta
      </button>
    </form>
  );
}
