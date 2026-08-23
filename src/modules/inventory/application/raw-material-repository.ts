import type {
  PublicTableRow,
  TypedSupabaseClient,
} from '@/infrastructure/integrations/supabase/database.types';

type CategorySelection = Pick<PublicTableRow<'categories'>, 'id' | 'name' | 'code_prefix'>;
type FamilySelection = Pick<PublicTableRow<'families'>, 'id' | 'name' | 'category_id'>;
type UnitSelection = Pick<PublicTableRow<'units_of_measure'>, 'id' | 'name' | 'code'>;

export type RawMaterialFormCatalog = {
  categories: Array<Omit<CategorySelection, 'code_prefix'> & { code_prefix: string }>;
  families: FamilySelection[];
  unitsOfMeasure: UnitSelection[];
};

export async function fetchRawMaterialFormCatalog(
  supabase: TypedSupabaseClient,
): Promise<RawMaterialFormCatalog> {
  const [categories, families, units] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, code_prefix')
      .is('deleted_at', null)
      .order('name'),
    supabase
      .from('families')
      .select('id, name, category_id')
      .is('deleted_at', null)
      .order('name'),
    supabase
      .from('units_of_measure')
      .select('id, name, code')
      .eq('is_active', true)
      .order('name'),
  ]);

  for (const result of [categories, families, units]) {
    if (result.error) throw new Error(result.error.message);
  }

  return {
    categories: (categories.data ?? []).map((category) => ({
      ...category,
      code_prefix: category.code_prefix ?? '',
    })),
    families: families.data ?? [],
    unitsOfMeasure: units.data ?? [],
  };
}
