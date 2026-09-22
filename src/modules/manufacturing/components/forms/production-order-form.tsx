'use client';

interface Recipe {
  id: string;
  name: string;
}

interface Props {
  action: (formData: FormData) => Promise<void>;
  recipes: Recipe[];
  initialValues?: {
    recipe_id?: string;
    planned_quantity?: number;
    notes?: string;
  };
}

export function ProductionOrderForm({
  action,
  recipes,
  initialValues,
}: Props) {
  return (
    <form
      action={action}
      className="space-y-6 rounded-2xl border bg-white p-6"
    >
      <div>
        <label className="mb-2 block font-medium">
          Receta *
        </label>

        <select
          name="recipe_id"
          required
          defaultValue={initialValues?.recipe_id ?? ''}
          className="w-full rounded border p-3"
        >
          <option value="">
            Seleccionar receta
          </option>

          {recipes.map((recipe) => (
            <option key={recipe.id} value={recipe.id}>
              {recipe.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block font-medium">
          Cantidad a producir *
        </label>

        <input
          type="number"
          step="0.0001"
          min="0.0001"
          name="planned_quantity"
          required
          defaultValue={initialValues?.planned_quantity ?? 1}
          className="w-full rounded border p-3"
          placeholder="100"
        />
      </div>

      <div>
        <label className="mb-2 block font-medium">
          Notas
        </label>

        <textarea
          name="notes"
          rows={4}
          defaultValue={initialValues?.notes ?? ''}
          className="w-full rounded border p-3"
          placeholder="Observaciones de producción..."
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
