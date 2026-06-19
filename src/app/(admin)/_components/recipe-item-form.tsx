'use client';

interface Material {
  id: string;
  name: string;
}

interface Props {
  action: (formData: FormData) => Promise<void>;
  materials: Material[];
}

export function RecipeItemsForm({
  action,
  materials,
}: Props) {
  return (
    <form
      action={action}
      className="space-y-4 rounded-xl border p-4"
    >
      <div>
        <label className="mb-2 block font-medium">
          Ingrediente
        </label>

        <select
          name="ingredient_id"
          required
          className="w-full rounded border p-3"
        >
          <option value="">
            Seleccionar ingrediente
          </option>

          {materials.map((material) => (
            <option
              key={material.id}
              value={material.id}
            >
              {material.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block font-medium">
          Cantidad
        </label>

        <input
          type="number"
          step="0.0001"
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
