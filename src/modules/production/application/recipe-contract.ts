import type {
  PublicTableInsert,
  PublicTableUpdate,
} from '@/infrastructure/integrations/supabase/database.types';

type RecipeInsert = PublicTableInsert<'recipes'>;
type RecipeUpdate = PublicTableUpdate<'recipes'>;
type RecipeItemInsert = PublicTableInsert<'recipe_items'>;
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
  return { ...buildRecipeInsert(form), updated_at: updatedAt };
}

export function buildRecipeItemInsert(form: FormData): RecipeItemInsert {
  return {
    recipe_id: requiredText(form, 'recipe_id'),
    raw_material_id: requiredText(form, 'raw_material_id'),
    quantity: positiveNumber(form, 'quantity', 'La cantidad'),
  };
}
