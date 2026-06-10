'use client';

interface RecipeItemFormProps {
  action: (formData: FormData) => Promise<void>;

  products: {
    id: string;
    name: string;
  }[];
}

export function RecipeItemForm({
  action,
  products,
}: RecipeItemFormProps) {
  return (
    <form
      action={action}
      className="space-y-4 rounded-xl border p-4"
    >
      <div>
        <label className="mb-2 block">
          Ingrediente
        </label>

        <select
          name="ingredient_id"
          required
          className="w-full rounded border p-3"
        >
          <option value="">
            Seleccionar
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
        <label className="mb-2 block">
          Cantidad
        </label>

        <input
          type="number"
          step="0.01"
          name="quantity"
          required
          className="w-full rounded border p-3"
        />
      </div>

      <button
        type="submit"
        className="rounded border px-4 py-2"
      >
        Agregar Ingrediente
      </button>
    </form>
  );
}
