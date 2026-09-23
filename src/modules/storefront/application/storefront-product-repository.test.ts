import { describe, expect, it } from 'vitest';

import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

import {
  fetchPublishedStorefrontProduct,
  fetchPublishedStorefrontProducts,
  upsertStorefrontProduct,
} from './storefront-product-repository';

type Result = { data: unknown; error: { message: string } | null };
type QueryBuilder = Promise<Result> & {
  select: (columns: string) => QueryBuilder;
  eq: (column: string, value: unknown) => QueryBuilder;
  lte: (column: string, value: unknown) => QueryBuilder;
  order: (column: string, options: unknown) => QueryBuilder;
  maybeSingle: () => Promise<Result>;
};

function clientWith(data: unknown, error: { message: string } | null = null) {
  const calls: unknown[] = [];
  
  const query: QueryBuilder = Object.assign(Promise.resolve({ data, error }), {
    select(columns: string) { calls.push(['select', columns]); return query; },
    eq(column: string, value: unknown) { calls.push(['eq', column, value]); return query; },
    lte(column: string, value: unknown) { calls.push(['lte', column, value]); return query; },
    order(column: string, options: unknown) { calls.push(['order', column, options]); return query; },
    maybeSingle() { calls.push(['maybeSingle']); return Promise.resolve({ data, error }); },
  });
  
  const client = {
    from(table: string) {
      calls.push(['from', table]);
      return {
        ...query,
        upsert(value: unknown, options: unknown) {
          calls.push(['upsert', value, options]);
          return Promise.resolve({ data: null, error });
        },
      };
    },
  } as unknown as TypedSupabaseClient;
  return { client, calls };
}

describe('repositorio del catálogo público', () => {
  it('lista únicamente fichas publicadas y ordena destacadas primero', async () => {
    const { client, calls } = clientWith([]);
    await fetchPublishedStorefrontProducts(client, '2026-09-17T12:00:00.000Z');

    expect(calls).toEqual(expect.arrayContaining([
      ['from', 'storefront_products'],
      ['eq', 'is_published', true],
      ['lte', 'published_at', '2026-09-17T12:00:00.000Z'],
      ['order', 'is_featured', { ascending: false }],
      ['order', 'name', { ascending: true }],
    ]));
  });

  it('resuelve una ficha por slug sin consultar productos internos', async () => {
    const { client, calls } = clientWith({ slug: 'tequenos-queso' });
    await expect(fetchPublishedStorefrontProduct(
      client,
      'tequenos-queso',
      '2026-09-17T12:00:00.000Z',
    )).resolves.toEqual({ slug: 'tequenos-queso' });

    expect(calls).toContainEqual(['from', 'storefront_products']);
    expect(calls).toContainEqual(['eq', 'slug', 'tequenos-queso']);
    expect(calls).not.toContainEqual(['from', 'products']);
  });

  it('guarda la proyección pública con conflicto por producto', async () => {
    const { client, calls } = clientWith(null);
    const input = { product_id: 'product-1', slug: 'tequenos-queso' } as never;
    await upsertStorefrontProduct(client, input);
    expect(calls).toContainEqual(['upsert', input, { onConflict: 'product_id' }]);
  });

  it('propaga errores sin convertirlos en catálogo vacío', async () => {
    const { client } = clientWith(null, { message: 'RLS denied' });
    await expect(fetchPublishedStorefrontProducts(client, '2026-09-17T12:00:00.000Z'))
      .rejects.toThrow('RLS denied');
  });
});
