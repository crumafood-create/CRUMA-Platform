import { describe, expect, it } from 'vitest';

import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

import {
  assertProductFamilyBelongsToCategory,
  fetchProductFormCatalog,
} from './product-catalog-repository';

type TableName =
  | 'categories'
  | 'product_families'
  | 'flavors'
  | 'preparation_types'
  | 'units_of_measure';
type Result = { data: unknown; error: { message: string } | null };
type QueryBuilder = Promise<Result> & {
  select: () => QueryBuilder;
  is: () => QueryBuilder;
  eq: () => QueryBuilder;
  order: () => QueryBuilder;
  single: () => Promise<Result>;
};

function clientWith(fixtures: Partial<Record<TableName, Result>>) {
  const calls: TableName[] = [];

  const client = {
    from(table: TableName) {
      calls.push(table);

      const result = fixtures[table] ?? { data: [], error: null };
      let query: QueryBuilder;

      query = Object.assign(Promise.resolve(result), {
        select() { return query; },
        is() { return query; },
        eq() { return query; },
        order() { return query; },
        single() { return Promise.resolve(result); },
      });

      return query;
    },
  } as unknown as TypedSupabaseClient;

  return { client, calls };
}

describe('repositorio tipado del catálogo de productos', () => {
  it('obtiene los cinco catálogos del formulario y normaliza sus prefijos', async () => {
    const { client, calls } = clientWith({
      categories: {
        data: [{ id: 'category-1', name: 'Panadería', code_prefix: null }],
        error: null,
      },
      product_families: {
        data: [{ id: 'family-1', name: 'Panes', category_id: 'category-1' }],
        error: null,
      },
      units_of_measure: {
        data: [{ id: 'unit-1', name: 'Pieza', code: 'pza' }],
        error: null,
      },
    });

    const catalog = await fetchProductFormCatalog(client);

    expect(calls).toEqual([
      'categories',
      'product_families',
      'flavors',
      'preparation_types',
      'units_of_measure',
    ]);
    expect(catalog.categories[0]?.code_prefix).toBe('');
    expect(catalog.families[0]?.category_id).toBe('category-1');
    expect(catalog.unitsOfMeasure[0]?.code).toBe('pza');
  });

  it('propaga errores de los catálogos relacionados', async () => {
    const { client } = clientWith({
      flavors: { data: null, error: { message: 'Sabores no disponibles.' } },
    });

    await expect(fetchProductFormCatalog(client)).rejects.toThrow(
      'Sabores no disponibles.',
    );
  });

  it('acepta una familia perteneciente a la categoría seleccionada', async () => {
    const { client } = clientWith({
      product_families: {
        data: { id: 'family-1', category_id: 'category-1' },
        error: null,
      },
    });

    await assertProductFamilyBelongsToCategory(client, 'category-1', 'family-1');
  });

  it('rechaza familias pertenecientes a una categoría diferente', async () => {
    const { client } = clientWith({
      product_families: {
        data: { id: 'family-1', category_id: 'category-2' },
        error: null,
      },
    });

    await expect(
      assertProductFamilyBelongsToCategory(client, 'category-1', 'family-1'),
    ).rejects.toThrow('La familia no pertenece a la categoría seleccionada.');
  });

  it('rechaza familias inexistentes o eliminadas', async () => {
    const { client } = clientWith({
      product_families: { data: null, error: { message: 'Familia no disponible.' } },
    });

    await expect(
      assertProductFamilyBelongsToCategory(client, 'category-1', 'family-1'),
    ).rejects.toThrow('Familia no disponible.');
  });

  it('omite consultas cuando categoría y familia están vacías', async () => {
    const { client, calls } = clientWith({});

    await assertProductFamilyBelongsToCategory(client, null, null);

    expect(calls).toEqual([]);
  });
});
