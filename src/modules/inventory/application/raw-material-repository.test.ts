import { describe, expect, it } from 'vitest';

import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

import {
  assertRawMaterialFamilyBelongsToCategory,
  fetchRawMaterialFormCatalog,
} from './raw-material-repository';

type TableName = 'categories' | 'families' | 'units_of_measure';
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

describe('repositorio tipado de catálogos para materias primas', () => {
  it('consulta categorías, familias y unidades en un único contrato', async () => {
    const { client, calls } = clientWith({
      categories: { data: [{ id: 'category-1', name: 'Harinas', code_prefix: 'MP' }], error: null },
      families: { data: [{ id: 'family-1', name: 'Trigo', category_id: 'category-1' }], error: null },
      units_of_measure: { data: [{ id: 'unit-1', name: 'Gramo', code: 'g' }], error: null },
    });

    const result = await fetchRawMaterialFormCatalog(client);

    expect(calls).toEqual(['categories', 'families', 'units_of_measure']);
    expect(result.categories[0]?.code_prefix).toBe('MP');
    expect(result.families[0]?.category_id).toBe('category-1');
    expect(result.unitsOfMeasure[0]?.code).toBe('g');
  });

  it('normaliza prefijos de categoría nulos para el formulario', async () => {
    const { client } = clientWith({
      categories: { data: [{ id: 'category-1', name: 'Harinas', code_prefix: null }], error: null },
    });

    expect((await fetchRawMaterialFormCatalog(client)).categories[0]?.code_prefix).toBe('');
  });

  it('propaga fallos de catálogos relacionados', async () => {
    const { client } = clientWith({
      families: { data: null, error: { message: 'Familias no disponibles.' } },
    });

    await expect(fetchRawMaterialFormCatalog(client)).rejects.toThrow(
      'Familias no disponibles.',
    );
  });

  it('acepta familias activas pertenecientes a la categoría seleccionada', async () => {
    const { client, calls } = clientWith({
      families: { data: { id: 'family-1', category_id: 'category-1' }, error: null },
    });

    await assertRawMaterialFamilyBelongsToCategory(client, 'category-1', 'family-1');

    expect(calls).toEqual(['families']);
  });

  it('rechaza familias pertenecientes a otra categoría', async () => {
    const { client } = clientWith({
      families: { data: { id: 'family-1', category_id: 'category-2' }, error: null },
    });

    await expect(
      assertRawMaterialFamilyBelongsToCategory(client, 'category-1', 'family-1'),
    ).rejects.toThrow('La familia no pertenece a la categoría seleccionada.');
  });

  it('rechaza familias inexistentes o eliminadas', async () => {
    const { client } = clientWith({
      families: { data: null, error: { message: 'Familia no disponible.' } },
    });

    await expect(
      assertRawMaterialFamilyBelongsToCategory(client, 'category-1', 'family-1'),
    ).rejects.toThrow('Familia no disponible.');
  });

  it('rechaza respuestas sin una familia activa', async () => {
    const { client } = clientWith({
      families: { data: null, error: null },
    });

    await expect(
      assertRawMaterialFamilyBelongsToCategory(client, 'category-1', 'family-1'),
    ).rejects.toThrow('Familia de materia prima no encontrada.');
  });

  it('rechaza una familia sin categoría antes de consultar', async () => {
    const { client, calls } = clientWith({});

    await expect(
      assertRawMaterialFamilyBelongsToCategory(client, null, 'family-1'),
    ).rejects.toThrow('La familia de una materia prima requiere una categoría.');

    expect(calls).toEqual([]);
  });

  it.each([null, 'category-1'])(
    'omite consultas cuando la categoría %j no tiene familia',
    async (categoryId) => {
      const { client, calls } = clientWith({});

      await assertRawMaterialFamilyBelongsToCategory(client, categoryId, null);

      expect(calls).toEqual([]);
    },
  );
});
