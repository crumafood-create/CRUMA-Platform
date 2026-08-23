import type {
  PublicTableInsert,
  PublicTableRow,
  PublicTableUpdate,
} from '@/infrastructure/integrations/supabase/database.types';

type ProductInsert = PublicTableInsert<'products'>;
type ProductUpdate = PublicTableUpdate<'products'>;
type ProductFormSelection = Pick<
  PublicTableRow<'products'>,
  | 'name'
  | 'slug'
  | 'internal_code'
  | 'category_id'
  | 'family_id'
  | 'flavor_id'
  | 'preparation_type_id'
  | 'unit_of_measure_id'
  | 'short_description'
  | 'description'
  | 'image_url'
  | 'image_alt'
  | 'seo_title'
  | 'seo_description'
  | 'status'
  | 'is_featured'
  | 'min_stock'
>;

const PRODUCT_STATUSES = new Set(['active', 'inactive', 'draft']);

function requiredText(form: FormData, field: string): string {
  const value = form.get(field)?.toString().trim() ?? '';

  if (!value) throw new Error(`El campo ${field} es obligatorio.`);

  return value;
}

function optionalText(form: FormData, field: string): string | null {
  return form.get(field)?.toString().trim() || null;
}

function productStatus(form: FormData): string {
  const status = optionalText(form, 'status') ?? 'active';

  if (!PRODUCT_STATUSES.has(status)) {
    throw new Error('Estado de producto inválido.');
  }

  return status;
}

function minimumStock(form: FormData): number {
  const quantity = Number(optionalText(form, 'min_stock') ?? 0);

  if (!Number.isFinite(quantity) || quantity < 0) {
    throw new Error('El campo min_stock debe ser un número no negativo y finito.');
  }

  return quantity;
}

export function buildProductInsert(form: FormData): ProductInsert {
  const categoryId = optionalText(form, 'category_id');
  const familyId = optionalText(form, 'family_id');

  if (Boolean(categoryId) !== Boolean(familyId)) {
    throw new Error('Categoría y familia deben seleccionarse juntas.');
  }

  return {
    name: requiredText(form, 'name'),
    slug: requiredText(form, 'slug'),
    internal_code: optionalText(form, 'internal_code'),
    category_id: categoryId,
    family_id: familyId,
    flavor_id: optionalText(form, 'flavor_id'),
    preparation_type_id: optionalText(form, 'preparation_type_id'),
    unit_of_measure_id: optionalText(form, 'unit_of_measure_id'),
    short_description: optionalText(form, 'short_description'),
    description: optionalText(form, 'description'),
    image_url: optionalText(form, 'image_url'),
    image_alt: optionalText(form, 'image_alt'),
    seo_title: optionalText(form, 'seo_title'),
    seo_description: optionalText(form, 'seo_description'),
    status: productStatus(form),
    is_featured: form.get('is_featured') === 'on',
    min_stock: minimumStock(form),
  };
}

export function buildProductUpdate(form: FormData, updatedAt: string): ProductUpdate {
  return { ...buildProductInsert(form), updated_at: updatedAt };
}

export function normalizeProductFormValues(product: ProductFormSelection) {
  return {
    name: product.name,
    slug: product.slug,
    internal_code: product.internal_code ?? '',
    category_id: product.category_id ?? '',
    family_id: product.family_id ?? '',
    flavor_id: product.flavor_id ?? '',
    preparation_type_id: product.preparation_type_id ?? '',
    unit_of_measure_id: product.unit_of_measure_id ?? '',
    short_description: product.short_description ?? '',
    description: product.description ?? '',
    image_url: product.image_url ?? '',
    image_alt: product.image_alt ?? '',
    seo_title: product.seo_title ?? '',
    seo_description: product.seo_description ?? '',
    status: product.status ?? 'active',
    is_featured: product.is_featured ?? false,
    min_stock: product.min_stock ?? 0,
  };
}
