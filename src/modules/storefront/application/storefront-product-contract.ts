import type { PublicTableInsert } from '@/infrastructure/integrations/supabase/database.types';

export type StorefrontProductUpsert = PublicTableInsert<'storefront_products'>;

const PRODUCT_IMAGE_ORIGIN = 'https://poglpqvmbrfcvtuspvtx.supabase.co';
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function text(form: FormData, field: string): string {
  return form.get(field)?.toString().trim() ?? '';
}

function optionalText(form: FormData, field: string): string | null {
  return text(form, field) || null;
}

function requiredText(form: FormData, field: string): string {
  const value = text(form, field);
  if (!value) throw new Error(`El campo ${field} es obligatorio.`);
  return value;
}

function publicPrice(form: FormData): number {
  const rawPrice = text(form, 'price');
  const price = Number(rawPrice);
  if (!rawPrice || !Number.isFinite(price) || price < 0) {
    throw new Error('El precio público debe ser un número no negativo y finito.');
  }
  return price;
}

function publicImage(form: FormData): string | null {
  const imageUrl = optionalText(form, 'image_url');
  if (!imageUrl) return null;

  let url: URL;
  try {
    url = new URL(imageUrl);
  } catch {
    throw new Error('La imagen pública debe pertenecer al almacenamiento autorizado.');
  }

  if (url.origin !== PRODUCT_IMAGE_ORIGIN || !url.pathname.startsWith('/storage/v1/object/public/')) {
    throw new Error('La imagen pública debe pertenecer al almacenamiento autorizado.');
  }
  return url.toString();
}

export function buildStorefrontProductUpsert(
  productId: string,
  form: FormData,
  now: string,
): StorefrontProductUpsert {
  if (!UUID.test(productId)) throw new Error('Identificador de producto inválido.');

  const slug = requiredText(form, 'slug');
  const categorySlug = requiredText(form, 'category_slug');
  if (!SLUG.test(slug) || !SLUG.test(categorySlug)) {
    throw new Error('Los slugs públicos tienen un formato inválido.');
  }

  const isPublished = form.get('is_published') === 'on';
  const imageUrl = publicImage(form);
  const imageAlt = text(form, 'image_alt');
  const shortDescription = requiredText(form, 'short_description');
  const presentation = requiredText(form, 'presentation');

  if (isPublished && (!imageUrl || !imageAlt || !shortDescription || !presentation)) {
    throw new Error('Completa la ficha comercial y la imagen antes de publicar.');
  }

  const currency = requiredText(form, 'currency');
  if (currency !== 'MXN') throw new Error('La moneda pública debe ser MXN.');

  return {
    product_id: productId,
    slug,
    name: requiredText(form, 'name'),
    short_description: shortDescription,
    description: optionalText(form, 'description'),
    category_slug: categorySlug,
    category_name: requiredText(form, 'category_name'),
    presentation,
    price: publicPrice(form),
    currency,
    image_url: imageUrl,
    image_alt: imageAlt,
    seo_title: optionalText(form, 'seo_title'),
    seo_description: optionalText(form, 'seo_description'),
    is_featured: form.get('is_featured') === 'on',
    is_published: isPublished,
    published_at: isPublished ? now : null,
    updated_at: now,
  };
}
