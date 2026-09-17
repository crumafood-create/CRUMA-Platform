import { describe, expect, it } from 'vitest';

import { buildStorefrontProductUpsert } from './storefront-product-contract';

const PRODUCT_ID = '8f000000-0000-0000-0000-000000000001';
const NOW = '2026-09-17T12:00:00.000Z';

function form(overrides: Record<string, string> = {}) {
  const data = new FormData();
  Object.entries({
    slug: 'tequenos-queso',
    name: 'Tequeños de queso',
    short_description: 'Crujientes por fuera y suaves por dentro.',
    description: 'Una ficha comercial completa.',
    category_slug: 'tequenos',
    category_name: 'Tequeños',
    presentation: 'Caja con 12 piezas',
    price: '149.90',
    currency: 'MXN',
    image_url: 'https://poglpqvmbrfcvtuspvtx.supabase.co/storage/v1/object/public/products/tequenos.jpg',
    image_alt: 'Tequeños de queso servidos',
    seo_title: 'Tequeños de queso',
    seo_description: 'Tequeños congelados listos para preparar.',
    is_featured: 'on',
    is_published: 'on',
    ...overrides,
  }).forEach(([key, value]) => data.set(key, value));
  return data;
}

describe('contrato de publicación del catálogo público', () => {
  it('normaliza una ficha pública completa y fecha su publicación', () => {
    expect(buildStorefrontProductUpsert(PRODUCT_ID, form(), NOW)).toEqual({
      product_id: PRODUCT_ID,
      slug: 'tequenos-queso',
      name: 'Tequeños de queso',
      short_description: 'Crujientes por fuera y suaves por dentro.',
      description: 'Una ficha comercial completa.',
      category_slug: 'tequenos',
      category_name: 'Tequeños',
      presentation: 'Caja con 12 piezas',
      price: 149.9,
      currency: 'MXN',
      image_url: 'https://poglpqvmbrfcvtuspvtx.supabase.co/storage/v1/object/public/products/tequenos.jpg',
      image_alt: 'Tequeños de queso servidos',
      seo_title: 'Tequeños de queso',
      seo_description: 'Tequeños congelados listos para preparar.',
      is_featured: true,
      is_published: true,
      published_at: NOW,
      updated_at: NOW,
    });
  });

  it.each(['-1', 'Infinity', 'texto'])('rechaza un precio público inválido: %s', (price) => {
    expect(() => buildStorefrontProductUpsert(PRODUCT_ID, form({ price }), NOW))
      .toThrow('El precio público debe ser un número no negativo y finito.');
  });

  it('solo permite imágenes del almacenamiento público autorizado', () => {
    expect(() => buildStorefrontProductUpsert(
      PRODUCT_ID,
      form({ image_url: 'https://example.com/producto.jpg' }),
      NOW,
    )).toThrow('La imagen pública debe pertenecer al almacenamiento autorizado.');
  });

  it('exige ficha e imagen completas antes de publicar', () => {
    expect(() => buildStorefrontProductUpsert(
      PRODUCT_ID,
      form({ image_alt: '' }),
      NOW,
    )).toThrow('Completa la ficha comercial y la imagen antes de publicar.');
  });

  it('mantiene sin fecha una ficha guardada como borrador', () => {
    const draft = form({ is_published: '' });
    expect(buildStorefrontProductUpsert(PRODUCT_ID, draft, NOW).published_at).toBeNull();
  });
});
