import type {
  PublicTableInsert,
  PublicTableRow,
  TypedSupabaseClient,
} from '@/infrastructure/integrations/supabase/database.types';

export type StorefrontProduct = PublicTableRow<'storefront_products'>;
export type StorefrontProductUpsert = PublicTableInsert<'storefront_products'>;

const PUBLIC_FIELDS = [
  'product_id',
  'slug',
  'name',
  'short_description',
  'description',
  'category_slug',
  'category_name',
  'presentation',
  'price',
  'currency',
  'image_url',
  'image_alt',
  'seo_title',
  'seo_description',
  'is_featured',
  'is_published',
  'published_at',
  'created_at',
  'updated_at',
].join(', ');

export async function fetchPublishedStorefrontProducts(
  client: TypedSupabaseClient,
  now: string,
): Promise<StorefrontProduct[]> {
  const { data, error } = await client
    .from('storefront_products')
    .select(PUBLIC_FIELDS)
    .eq('is_published', true)
    .lte('published_at', now)
    .order('is_featured', { ascending: false })
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as StorefrontProduct[];
}

export async function fetchPublishedStorefrontProduct(
  client: TypedSupabaseClient,
  slug: string,
  now: string,
): Promise<StorefrontProduct | null> {
  const { data, error } = await client
    .from('storefront_products')
    .select(PUBLIC_FIELDS)
    .eq('slug', slug)
    .eq('is_published', true)
    .lte('published_at', now)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as StorefrontProduct | null;
}

export async function fetchStorefrontProductForAdmin(
  client: TypedSupabaseClient,
  productId: string,
): Promise<StorefrontProduct | null> {
  const { data, error } = await client
    .from('storefront_products')
    .select(PUBLIC_FIELDS)
    .eq('product_id', productId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as StorefrontProduct | null;
}

export async function upsertStorefrontProduct(
  client: TypedSupabaseClient,
  input: StorefrontProductUpsert,
): Promise<void> {
  const { error } = await client
    .from('storefront_products')
    .upsert(input, { onConflict: 'product_id' });

  if (error) throw new Error(error.message);
}
