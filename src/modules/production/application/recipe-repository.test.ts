import { describe, expect, it } from 'vitest';

import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

import {
  assertRecipeItemReferencesAvailable,
  assertRecipeReferencesAvailable,
} from './recipe-repository';

type TableName = 'products' | 'units_of_measure' | 'recipes' | 'raw_materials' | 'recipe_items';
type Result = { data: unknown; error: { message: string } | null };
type QueryBuilder = {
  select: () => QueryBuilder;
  eq: (field: string, value: unknown) => QueryBuilder;
  is: (field: string, value: unknown) => QueryBuilder;
  maybeSingle: () => Promise<Result>;
};

function clientWith(fixtures: Partial<Record<TableName, Result>>) {
  const calls: TableName[] = [];
  const filters: Array<[string, unknown]> = [];
  const client = {
    from(table: TableName) {
      calls.push(table);
      const result = fixtures[table] ?? { data: { id: `${table}-1` }, error: null };
      const query: QueryBuilder = {
        select: () => query,
        eq(field, value) { filters.push([field, value]); return query; },
        is(field, value) { filters.push([field, value]); return query; },
        maybeSingle: () => Promise.resolve(result),
      };

      return query;
    },
  } as unknown as TypedSupabaseClient;

  return { client, calls, filters };
}

describe('integridad de referencias de receta', () => {
  it('verifica producto activo y unidad activa', async () => {
    const { client, calls, filters } = clientWith({});

    await assertRecipeReferencesAvailable(client, 'product-1', 'unit-1');

    expect(calls).toEqual(['products', 'units_of_measure']);
    expect(filters).toContainEqual(['status', 'active']);
    expect(filters).toContainEqual(['deleted_at', null]);
    expect(filters).toContainEqual(['is_active', true]);
  });

  it.each([
    ['products', 'El producto no existe o no está activo.'],
    ['units_of_measure', 'La unidad no existe o no está activa.'],
  ] as const)('rechaza referencias indisponibles en %s', async (table, message) => {
    const { client } = clientWith({ [table]: { data: null, error: null } });

    await expect(
      assertRecipeReferencesAvailable(client, 'product-1', 'unit-1'),
    ).rejects.toThrow(message);
  });

  it('propaga errores al verificar referencias de receta', async () => {
    const { client } = clientWith({
      products: { data: null, error: { message: 'Productos no disponibles.' } },
    });

    await expect(
      assertRecipeReferencesAvailable(client, 'product-1', 'unit-1'),
    ).rejects.toThrow('Productos no disponibles.');
  });
});

describe('integridad de ingredientes de receta', () => {
  it('verifica receta activa, materia prima vigente y duplicados', async () => {
    const { client, calls } = clientWith({
      recipe_items: { data: null, error: null },
    });

    await assertRecipeItemReferencesAvailable(client, 'recipe-1', 'material-1');

    expect(calls).toEqual(['recipes', 'raw_materials', 'recipe_items']);
  });

  it.each([
    ['recipes', 'La receta no existe o no está activa.'],
    ['raw_materials', 'La materia prima no existe o fue eliminada.'],
  ] as const)('rechaza referencias indisponibles en %s', async (table, message) => {
    const { client } = clientWith({
      [table]: { data: null, error: null },
      recipe_items: { data: null, error: null },
    });

    await expect(
      assertRecipeItemReferencesAvailable(client, 'recipe-1', 'material-1'),
    ).rejects.toThrow(message);
  });

  it('rechaza materias primas duplicadas', async () => {
    const { client } = clientWith({});

    await expect(
      assertRecipeItemReferencesAvailable(client, 'recipe-1', 'material-1'),
    ).rejects.toThrow('La materia prima ya pertenece a esta receta.');
  });

  it('propaga errores al verificar ingredientes', async () => {
    const { client } = clientWith({
      recipe_items: { data: null, error: { message: 'Ingredientes no disponibles.' } },
    });

    await expect(
      assertRecipeItemReferencesAvailable(client, 'recipe-1', 'material-1'),
    ).rejects.toThrow('Ingredientes no disponibles.');
  });
});
