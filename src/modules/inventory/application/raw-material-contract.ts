import type {
  PublicTableInsert,
  PublicTableRow,
  PublicTableUpdate,
} from '@/infrastructure/integrations/supabase/database.types';

type RawMaterialInsert = PublicTableInsert<'raw_materials'>;
type RawMaterialUpdate = PublicTableUpdate<'raw_materials'>;

type RawMaterialFormSelection = Pick<
  PublicTableRow<'raw_materials'>,
  | 'name'
  | 'slug'
  | 'internal_code'
  | 'category_id'
  | 'family_id'
  | 'unit_of_measure_id'
  | 'current_stock'
  | 'minimum_stock'
  | 'average_cost'
  | 'last_cost'
  | 'description'
  | 'is_active'
>;

function requiredText(form: FormData, field: string): string {
  const value = form.get(field)?.toString().trim() ?? '';

  if (!value) throw new Error(`El campo ${field} es obligatorio.`);

  return value;
}

function optionalText(form: FormData, field: string): string | null {
  return form.get(field)?.toString().trim() || null;
}

function nonNegativeNumber(form: FormData, field: string): number {
  const quantity = Number(form.get(field)?.toString().trim() || 0);

  if (!Number.isFinite(quantity) || quantity < 0) {
    throw new Error(`El campo ${field} debe ser un número no negativo y finito.`);
  }

  return quantity;
}

export function buildRawMaterialInsert(form: FormData): RawMaterialInsert {
  const categoryId = optionalText(form, 'category_id');
  const familyId = optionalText(form, 'family_id');

  if (familyId && !categoryId) {
    throw new Error('La familia de una materia prima requiere una categoría.');
  }

  return {
    name: requiredText(form, 'name'),
    slug: requiredText(form, 'slug'),
    internal_code: optionalText(form, 'internal_code'),
    category_id: categoryId,
    family_id: familyId,
    unit_of_measure_id: optionalText(form, 'unit_of_measure_id'),
    current_stock: nonNegativeNumber(form, 'current_stock'),
    minimum_stock: nonNegativeNumber(form, 'minimum_stock'),
    average_cost: nonNegativeNumber(form, 'average_cost'),
    last_cost: nonNegativeNumber(form, 'last_cost'),
    description: optionalText(form, 'description'),
    is_active: form.get('is_active') === 'true',
  };
}

export function buildRawMaterialUpdate(
  form: FormData,
  updatedAt: string,
): RawMaterialUpdate {
  return { ...buildRawMaterialInsert(form), updated_at: updatedAt };
}

export function normalizeRawMaterialFormValues(material: RawMaterialFormSelection) {
  return {
    name: material.name,
    slug: material.slug,
    internal_code: material.internal_code ?? '',
    category_id: material.category_id ?? '',
    family_id: material.family_id ?? '',
    unit_of_measure_id: material.unit_of_measure_id ?? '',
    current_stock: material.current_stock,
    minimum_stock: material.minimum_stock,
    average_cost: material.average_cost,
    last_cost: material.last_cost,
    description: material.description ?? '',
    is_active: material.is_active,
  };
}
