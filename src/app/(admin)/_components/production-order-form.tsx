'use client';

interface Props {
  action: (
    formData: FormData
  ) => Promise<void>;

  recipes: {
    id: string;

    products: {
      name: string;
    } | null;
  }[];
}

export function ProductionOrderForm({
  action,
  recipes,
}: Props) {
  return (
    <form
      action={action}
      className="space-y-6 rounded-2xl border p-6"
    >
      <div>
        <label>
          Receta
        </label>

        <select
          name="recipe_id"
          required
          className="w-full rounded border p-3"
        >
          <option value="">
            Seleccionar receta
          </option>

          {recipes.map(recipe => (
            <option
              key={recipe.id}
              value={recipe.id}
            >
              {recipe.products.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>
          Cantidad a producir
        </label>

        <input
          type="number"
          name="quantity"
          required
          className="w-full rounded border p-3"
        />
      </div>

      <div>
        <label>
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
        Crear Orden
      </button>
    </form>
  );
}
