import type {
  PublicTableInsert,
  PublicTableUpdate,
} from '@/infrastructure/integrations/supabase/database.types';

type RecipeInsert = PublicTableInsert<'recipes'>;
type RecipeUpdate = PublicTableUpdate<'recipes'>;
type RecipeItemInsert = {
  recipe_id: string;
  raw_material_id: string | null;
  product_id: string | null;
  quantity: number;
};
type RecipeItemUpdate = RecipeItemInsert & { id: string };
type ValidatedRecipeInsert = RecipeInsert & { unit_of_measure_id: string };

function requiredText(form: FormData, field: string): string {
  const value = form.get(field)?.toString().trim() ?? '';

  if (!value) throw new Error(`El campo ${field} es obligatorio.`);

  return value;
}

function positiveNumber(form: FormData, field: string, label: string): number {
  const rawValue = form.get(field)?.toString().trim() ?? '';
  const value = Number(rawValue);

  if (!rawValue || !Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} debe ser un número finito mayor que cero.`);
  }

  return value;
}

function recipeState(form: FormData): boolean {
  const value = form.get('is_active')?.toString() ?? 'true';

  if (value !== 'true' && value !== 'false') {
    throw new Error('Estado de receta inválido.');
  }

  return value === 'true';
}

export function buildRecipeInsert(form: FormData): ValidatedRecipeInsert {
  return {
    product_id: requiredText(form, 'product_id'),
    name: requiredText(form, 'name'),
    description: form.get('description')?.toString().trim() || null,
    yield_quantity: positiveNumber(form, 'yield_quantity', 'El rendimiento'),
    unit_of_measure_id: requiredText(form, 'unit_of_measure_id'),
    is_active: recipeState(form),
  };
}

export function buildRecipeUpdate(form: FormData, updatedAt: string): RecipeUpdate {
  return {
    name: requiredText(form, 'name'),
    description: form.get('description')?.toString().trim() || null,
    yield_quantity: positiveNumber(form, 'yield_quantity', 'El rendimiento'),
    is_active: recipeState(form),
    updated_at: updatedAt,
  };
}

export function buildRecipeItemInsert(form: FormData): RecipeItemInsert {
  const rawMaterialId = form.get('raw_material_id')?.toString().trim() || null;
  const productId = form.get('product_id')?.toString().trim() || null;

  if (Boolean(rawMaterialId) === Boolean(productId)) {
    throw new Error('Selecciona una materia prima o un producto intermedio, pero no ambos.');
  }

  return {
    recipe_id: requiredText(form, 'recipe_id'),
    raw_material_id: rawMaterialId,
    product_id: productId,
    quantity: positiveNumber(form, 'quantity', 'La cantidad'),
  };
}

export function buildRecipeItemUpdate(form: FormData): RecipeItemUpdate {
  return {
    ...buildRecipeItemInsert(form),
    id: requiredText(form, 'id'),
  };
}

export function buildRecipeItemDelete(form: FormData): { id: string; recipe_id: string } {
  return {
    id: requiredText(form, 'id'),
    recipe_id: requiredText(form, 'recipe_id'),
  };
}
