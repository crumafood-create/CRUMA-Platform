import type {
  PublicTableRow,
  TypedSupabaseClient,
} from '@/infrastructure/integrations/supabase/database.types';

type FamilyCategory = Pick<PublicTableRow<'categories'>, 'id' | 'name'>;

export async function fetchFamilyCategories(
  supabase: TypedSupabaseClient,
): Promise<FamilyCategory[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name')
    .is('deleted_at', null)
    .order('name');

  if (error) throw new Error(error.message);

  return data ?? [];
}

export async function assertCategoryExists(
  supabase: TypedSupabaseClient,
  categoryId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from('categories')
    .select('id')
    .eq('id', categoryId)
    .is('deleted_at', null)
    .single();

  if (error) throw new Error(error.message);

  if (!data) throw new Error('Categoría no encontrada.');
}

export async function assertCategoryCanBeDeleted(
  supabase: TypedSupabaseClient,
  categoryId: string,
): Promise<void> {
  const [families, productFamilies, products, rawMaterials] = await Promise.all([
    supabase
      .from('families')
      .select('id')
      .eq('category_id', categoryId)
      .is('deleted_at', null)
      .limit(1),
    supabase
      .from('product_families')
      .select('id')
      .eq('category_id', categoryId)
      .is('deleted_at', null)
      .limit(1),
    supabase
      .from('products')
      .select('id')
      .eq('category_id', categoryId)
      .is('deleted_at', null)
      .limit(1),
    supabase
      .from('raw_materials')
      .select('id')
      .eq('category_id', categoryId)
      .is('deleted_at', null)
      .limit(1),
  ]);

  for (const result of [families, productFamilies, products, rawMaterials]) {
    if (result.error) throw new Error(result.error.message);

    if (result.data?.length) {
      throw new Error('La categoría tiene familias, productos o materias primas activos.');
    }
  }
}

export async function assertFamilyCanBeDeleted(
  supabase: TypedSupabaseClient,
  familyId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from('raw_materials')
    .select('id')
    .eq('family_id', familyId)
    .is('deleted_at', null)
    .limit(1);

  if (error) throw new Error(error.message);

  if (data?.length) throw new Error('La familia tiene materias primas activas.');
}
