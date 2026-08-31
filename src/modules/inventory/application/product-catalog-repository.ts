import type {
  PublicTableRow,
  TypedSupabaseClient,
} from '@/infrastructure/integrations/supabase/database.types';

type CategorySelection = Pick<PublicTableRow<'categories'>, 'id' | 'name' | 'code_prefix'>;
type FamilySelection = Pick<PublicTableRow<'product_families'>, 'id' | 'name' | 'category_id'>;
type FlavorSelection = Pick<PublicTableRow<'flavors'>, 'id' | 'name'>;
type PreparationSelection = Pick<PublicTableRow<'preparation_types'>, 'id' | 'name'>;
type UnitSelection = Pick<PublicTableRow<'units_of_measure'>, 'id' | 'name' | 'code'>;

export type ProductFormCatalog = {
  categories: Array<Omit<CategorySelection, 'code_prefix'> & { code_prefix: string }>;
  families: FamilySelection[];
  flavors: FlavorSelection[];
  preparationTypes: PreparationSelection[];
  unitsOfMeasure: UnitSelection[];
};

export async function fetchProductFormCatalog(
  supabase: TypedSupabaseClient,
): Promise<ProductFormCatalog> {
  const [categories, families, flavors, preparations, units] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, code_prefix')
      .is('deleted_at', null)
      .order('name'),
    supabase
      .from('product_families')
      .select('id, name, category_id')
      .is('deleted_at', null)
      .order('name'),
    supabase
      .from('flavors')
      .select('id, name')
      .is('deleted_at', null)
      .order('name'),
    supabase.from('preparation_types').select('id, name').order('name'),
    supabase
      .from('units_of_measure')
      .select('id, name, code')
      .eq('is_active', true)
      .order('name'),
  ]);

  for (const result of [categories, families, flavors, preparations, units]) {
    if (result.error) throw new Error(result.error.message);
  }

  return {
    categories: (categories.data ?? []).map((category) => ({
      ...category,
      code_prefix: category.code_prefix ?? '',
    })),
    families: families.data ?? [],
    flavors: flavors.data ?? [],
    preparationTypes: preparations.data ?? [],
    unitsOfMeasure: units.data ?? [],
  };
}

export async function assertProductFamilyBelongsToCategory(
  supabase: TypedSupabaseClient,
  categoryId: string | null,
  familyId: string | null,
): Promise<void> {
  if (!categoryId && !familyId) return;

  if (!categoryId || !familyId) {
    throw new Error('Categoría y familia deben seleccionarse juntas.');
  }

  const { data: family, error } = await supabase
    .from('product_families')
    .select('id, category_id')
    .eq('id', familyId)
    .is('deleted_at', null)
    .single();

  if (error) throw new Error(error.message);

  if (!family) throw new Error('Familia de producto no encontrada.');

  if (family.category_id !== categoryId) {
    throw new Error('La familia no pertenece a la categoría seleccionada.');
  }
}

export async function assertPreparationTypeExists(
  supabase: TypedSupabaseClient,
  preparationTypeId: string | null,
): Promise<void> {
  if (!preparationTypeId) return;

  const { data, error } = await supabase
    .from('preparation_types')
    .select('id')
    .eq('id', preparationTypeId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (!data) throw new Error('Tipo de preparación no encontrado.');
}
