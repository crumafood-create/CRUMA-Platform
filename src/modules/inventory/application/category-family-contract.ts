import type {
  PublicTableInsert,
  PublicTableRow,
  PublicTableUpdate,
} from '@/infrastructure/integrations/supabase/database.types';

type CategoryInsert = PublicTableInsert<'categories'>;
type CategoryUpdate = PublicTableUpdate<'categories'>;
type FamilyInsert = PublicTableInsert<'families'>;
type FamilyUpdate = PublicTableUpdate<'families'>;

type CategoryFormSelection = Pick<
  PublicTableRow<'categories'>,
  'name' | 'slug' | 'description' | 'is_active'
>;

type FamilyFormSelection = Pick<
  PublicTableRow<'families'>,
  'category_id' | 'name' | 'slug' | 'internal_code' | 'description' | 'is_active'
>;

function requiredText(form: FormData, field: string): string {
  const value = form.get(field)?.toString().trim() ?? '';

  if (!value) throw new Error(`El campo ${field} es obligatorio.`);

  return value;
}

function optionalText(form: FormData, field: string): string | null {
  return form.get(field)?.toString().trim() || null;
}

export function buildCategoryInsert(form: FormData): CategoryInsert {
  return {
    name: requiredText(form, 'name'),
    slug: requiredText(form, 'slug'),
    description: optionalText(form, 'description'),
    is_active: form.get('is_active') === 'true',
  };
}

export function buildCategoryUpdate(form: FormData, updatedAt: string): CategoryUpdate {
  return { ...buildCategoryInsert(form), updated_at: updatedAt };
}

export function normalizeCategoryFormValues(category: CategoryFormSelection) {
  return {
    name: category.name,
    slug: category.slug,
    description: category.description ?? '',
    is_active: category.is_active ?? true,
  };
}

export function buildFamilyInsert(form: FormData): FamilyInsert {
  return {
    category_id: requiredText(form, 'category_id'),
    name: requiredText(form, 'name'),
    slug: requiredText(form, 'slug'),
    internal_code: requiredText(form, 'internal_code'),
    description: optionalText(form, 'description'),
    is_active: form.get('is_active') === 'true',
  };
}

export function buildFamilyUpdate(
  form: FormData,
  updatedAt: string,
): FamilyInsert & FamilyUpdate {
  return { ...buildFamilyInsert(form), updated_at: updatedAt };
}

export function normalizeFamilyFormValues(family: FamilyFormSelection) {
  return {
    category_id: family.category_id,
    name: family.name,
    slug: family.slug,
    internal_code: family.internal_code,
    description: family.description ?? '',
    is_active: family.is_active ?? true,
  };
}
