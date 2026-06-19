'use client';

interface Recipe {
  id: string;
  name: string;
}

interface Props {
  action: (
    formData: FormData
  ) => Promise<void>;

  recipes: Recipe[];
}

export function ProductionOrderForm({
  action,
  recipes,
}: Props) {
  return (
    <form
      action={action}
      className="space-y-6 rounded-2xl border bg-white p-6"
    >
      <div>
        <label className="mb-2 block font-medium">
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

          {recipes.map((recipe) => (
            <option
              key={recipe.id}
              value={recipe.id}
            >
              {recipe.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block font-medium">
          Cantidad a producir
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
