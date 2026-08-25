import { describe, expect, it } from 'vitest';

import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

import {
  assertCategoryCanBeDeleted,
  assertCategoryExists,
  assertFamilyCanBeDeleted,
  fetchFamilyCategories,
} from './category-family-repository';

type TableName = 'categories' | 'families' | 'product_families' | 'products' | 'raw_materials';
type Result = { data: unknown; error: { message: string } | null };
type QueryBuilder = Promise<Result> & {
  select: () => QueryBuilder;
  is: () => QueryBuilder;
  eq: () => QueryBuilder;
  order: () => QueryBuilder;
  limit: () => QueryBuilder;
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
        limit() { return query; },
        single() { return Promise.resolve(result); },
      });

      return query;
    },
  } as unknown as TypedSupabaseClient;

  return { client, calls };
}

describe('repositorio tipado de categorías y familias', () => {
  it('consulta categorías disponibles para los formularios de familias', async () => {
    const { client, calls } = clientWith({
      categories: { data: [{ id: 'category-1', name: 'Harinas' }], error: null },
    });

    const categories = await fetchFamilyCategories(client);

    expect(calls).toEqual(['categories']);
    expect(categories[0]?.name).toBe('Harinas');
  });

  it('propaga errores al consultar categorías', async () => {
    const { client } = clientWith({
      categories: { data: null, error: { message: 'Categorías no disponibles.' } },
    });

    await expect(fetchFamilyCategories(client)).rejects.toThrow(
      'Categorías no disponibles.',
    );
  });

  it('permite asociar familias a categorías existentes', async () => {
    const { client } = clientWith({
      categories: { data: { id: 'category-1' }, error: null },
    });

    await assertCategoryExists(client, 'category-1');
  });

  it('rechaza categorías eliminadas o inexistentes', async () => {
    const { client } = clientWith({
      categories: { data: null, error: { message: 'Categoría no encontrada.' } },
    });

    await expect(assertCategoryExists(client, 'category-1')).rejects.toThrow(
      'Categoría no encontrada.',
    );
  });

  it('verifica por separado las dos tablas de familias y sus dependencias', async () => {
    const { client, calls } = clientWith({});

    await assertCategoryCanBeDeleted(client, 'category-1');

    expect(calls).toEqual(['families', 'product_families', 'products', 'raw_materials']);
  });

  it.each(['families', 'product_families', 'products', 'raw_materials'] as const)(
    'bloquea categorías con referencias activas en %s',
    async (table) => {
      const { client } = clientWith({ [table]: { data: [{ id: 'related-1' }], error: null } });

      await expect(assertCategoryCanBeDeleted(client, 'category-1')).rejects.toThrow(
        'La categoría tiene familias, productos o materias primas activos.',
      );
    },
  );

  it('propaga fallos al comprobar dependencias de categorías', async () => {
    const { client } = clientWith({
      products: { data: null, error: { message: 'Dependencias no disponibles.' } },
    });

    await expect(assertCategoryCanBeDeleted(client, 'category-1')).rejects.toThrow(
      'Dependencias no disponibles.',
    );
  });

  it('permite eliminar familias sin materias primas asociadas', async () => {
    const { client, calls } = clientWith({});

    await assertFamilyCanBeDeleted(client, 'family-1');

    expect(calls).toEqual(['raw_materials']);
  });

  it('bloquea familias con materias primas activas', async () => {
    const { client } = clientWith({
      raw_materials: { data: [{ id: 'material-1' }], error: null },
    });

    await expect(assertFamilyCanBeDeleted(client, 'family-1')).rejects.toThrow(
      'La familia tiene materias primas activas.',
    );
  });
});
