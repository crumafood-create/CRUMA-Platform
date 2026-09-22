'use client';

interface Material {
  id: string;
  name: string;
}

interface Props {
  recipeId: string;

  materials: Material[];

  action: (
    formData: FormData
  ) => Promise<void>;
}

export function RecipeItemForm({
  recipeId,
  materials,
  action,
}: Props) {
  return (
    <form
      action={action}
      className="space-y-4 rounded border p-4"
    >
      <input
        type="hidden"
        name="recipe_id"
        value={recipeId}
      />

      <div>
        <label>
          Materia Prima
        </label>

        <select
          name="raw_material_id"
          required
          className="w-full rounded border p-3"
        >
          <option value="">
            Seleccionar
          </option>

          {materials.map(
            material => (
              <option
                key={material.id}
                value={material.id}
              >
                {material.name}
              </option>
            )
          )}
        </select>
      </div>

      <div>
        <label>
          Cantidad
        </label>

        <input
          type="number"
          step="0.001"
          min="0.001"
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
