'use client';

interface IngredientOption {
  id: string;
  name: string;
  unitLabel: string;
}

interface Props {
  recipeId: string;
  materials: IngredientOption[];
  intermediateProducts: IngredientOption[];
  action: (formData: FormData) => Promise<void>;
  initialValues?: {
    id?: string;
    raw_material_id?: string | null;
    product_id?: string | null;
    quantity?: number;
  };
}

export function RecipeItemForm({
  recipeId,
  materials,
  intermediateProducts,
  action,
  initialValues,
}: Props) {
  return (
    <form action={action} className="space-y-4 rounded border p-4">
      <input type="hidden" name="recipe_id" value={recipeId} />
      {initialValues?.id ? <input type="hidden" name="id" value={initialValues.id} /> : null}

      <div>
        <label className="mb-2 block font-medium">Materia prima</label>
        <select name="raw_material_id" className="w-full rounded border p-3" defaultValue={initialValues?.raw_material_id ?? ''}>
          <option value="">Seleccionar materia prima</option>
          {materials.map((material) => (
            <option key={material.id} value={material.id}>
              {material.name} · {material.unitLabel}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block font-medium">Producto intermedio (variedad de masa)</label>
        <select name="product_id" className="w-full rounded border p-3" defaultValue={initialValues?.product_id ?? ''}>
          <option value="">Seleccionar producto intermedio</option>
          {intermediateProducts.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} · {product.unitLabel}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-gray-500">
          Elige materia prima o producto intermedio, no ambos. Cada receta final admite una variedad de masa.
        </p>
      </div>

      <div>
        <label className="mb-2 block font-medium">Cantidad en la unidad base elegida</label>
        <input
          type="number"
          step="0.0001"
          min="0.0001"
          name="quantity"
          required
          defaultValue={initialValues?.quantity}
          className="w-full rounded border p-3"
        />
      </div>

      <button type="submit" className="rounded border px-4 py-2">
        {initialValues?.id ? 'Guardar ingrediente' : 'Agregar ingrediente'}
      </button>
    </form>
  );
}
