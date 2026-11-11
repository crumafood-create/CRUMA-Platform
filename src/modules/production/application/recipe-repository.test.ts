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
  limit: (value: number) => QueryBuilder;
  maybeSingle: () => Promise<Result>;
  then: (resolve: (result: Result) => unknown) => Promise<unknown>;
};

function clientWith(fixtures: Partial<Record<TableName, Result[]>>) {
  const calls: TableName[] = [];
  const filters: Array<[string, unknown]> = [];
  const offsets: Partial<Record<TableName, number>> = {};
  const defaults: Record<TableName, Result> = {
    products: { data: { id: 'product-1', unit_of_measure_id: 'unit-1' }, error: null },
    units_of_measure: { data: { id: 'unit-1' }, error: null },
    recipes: { data: { id: 'recipe-1', product_id: 'output-product', unit_of_measure_id: 'unit-1' }, error: null },
    raw_materials: { data: { id: 'material-1' }, error: null },
    recipe_items: { data: [], error: null },
  };

  const client = {
    from(table: TableName) {
      calls.push(table);
      const offset = offsets[table] ?? 0;
      offsets[table] = offset + 1;
      const result = fixtures[table]?.[offset] ?? defaults[table];
      const query: QueryBuilder = {
        select: () => query,
        eq(field, value) { filters.push([field, value]); return query; },
        is(field, value) { filters.push([field, value]); return query; },
        limit: () => query,
        maybeSingle: () => Promise.resolve(result),
        then: (resolve) => Promise.resolve(result).then(resolve),
      };

      return query;
    },
  } as unknown as TypedSupabaseClient;

  return { client, calls, filters };
}

describe('integridad de referencias de receta', () => {
  it('verifica producto activo y unidad base coincidente', async () => {
    const { client, calls, filters } = clientWith({});

    await assertRecipeReferencesAvailable(client, 'product-1', 'unit-1');

    expect(calls).toEqual(['products', 'units_of_measure']);
    expect(filters).toContainEqual(['status', 'active']);
    expect(filters).toContainEqual(['deleted_at', null]);
    expect(filters).toContainEqual(['is_active', true]);
  });

  it('rechaza una unidad de rendimiento distinta a la unidad base del producto', async () => {
    const { client } = clientWith({
      products: [{ data: { id: 'product-1', unit_of_measure_id: 'kg' }, error: null }],
      units_of_measure: [{ data: { id: 'piece' }, error: null }],
    });

    await expect(assertRecipeReferencesAvailable(client, 'product-1', 'piece')).rejects.toThrow(
      'La unidad de rendimiento debe coincidir con la unidad base del producto.',
    );
  });

  it.each([
    ['products', 'El producto no existe o no está activo.'],
    ['units_of_measure', 'La unidad no existe o no está activa.'],
  ] as const)('rechaza referencias indisponibles en %s', async (table, message) => {
    const { client } = clientWith({ [table]: [{ data: null, error: null }] });

    await expect(assertRecipeReferencesAvailable(client, 'product-1', 'unit-1')).rejects.toThrow(message);
  });
});

describe('integridad de ingredientes de receta', () => {
  it('admite materia prima con existencia cero sin consultar inventario', async () => {
    const { client, calls } = clientWith({
      recipes: [{ data: { id: 'recipe-1', product_id: 'output-product' }, error: null }],
      recipe_items: [{ data: [], error: null }],
      raw_materials: [{ data: { id: 'material-1' }, error: null }],
    });

    await assertRecipeItemReferencesAvailable(client, 'recipe-1', {
      rawMaterialId: 'material-1',
      productId: null,
    });

    expect(calls).toEqual(['recipes', 'recipe_items', 'raw_materials']);
    expect(calls).not.toContain('inventory_stock_by_item');
    expect(calls).not.toContain('raw_material_lots');
  });

  it('permite conservar el ingrediente del renglón editado sin permitir duplicados', async () => {
    const { client } = clientWith({
      recipe_items: [{ data: [{ id: 'item-1', raw_material_id: 'material-1', product_id: null }], error: null }],
    });

    await expect(assertRecipeItemReferencesAvailable(
      client,
      'recipe-1',
      { rawMaterialId: 'material-1', productId: null },
      'item-1',
    )).resolves.toBeUndefined();
  });

  it('admite un producto activo que tiene su receta y conserva la unidad base', async () => {
    const { client, calls } = clientWith({
      recipes: [
        { data: { id: 'final-recipe', product_id: 'party-product' }, error: null },
        { data: { id: 'dough-recipe', unit_of_measure_id: 'kg' }, error: null },
      ],
      recipe_items: [{ data: [], error: null }],
      products: [{ data: { id: 'dough-product', unit_of_measure_id: 'kg' }, error: null }],
    });

    await expect(assertRecipeItemReferencesAvailable(client, 'final-recipe', {
      rawMaterialId: null,
      productId: 'dough-product',
    })).resolves.toBeUndefined();

    expect(calls).toEqual(['recipes', 'recipe_items', 'products', 'recipes']);
  });

  it('rechaza que la receta use su propio producto de salida', async () => {
    const { client } = clientWith({
      recipes: [{ data: { id: 'recipe-1', product_id: 'same-product' }, error: null }],
    });

    await expect(assertRecipeItemReferencesAvailable(client, 'recipe-1', {
      rawMaterialId: null,
      productId: 'same-product',
    })).rejects.toThrow('Una receta no puede usar su propio producto de salida como ingrediente.');
  });

  it('rechaza una segunda variedad de masa en la misma receta', async () => {
    const { client } = clientWith({
      recipes: [{ data: { id: 'recipe-1', product_id: 'party-product' }, error: null }],
      recipe_items: [{ data: [{ raw_material_id: null, product_id: 'other-dough' }], error: null }],
    });

    await expect(assertRecipeItemReferencesAvailable(client, 'recipe-1', {
      rawMaterialId: null,
      productId: 'dough-product',
    })).rejects.toThrow('Cada receta puede usar una sola variedad de masa.');
  });

  it('rechaza un producto intermedio sin receta activa', async () => {
    const { client } = clientWith({
      recipes: [
        { data: { id: 'recipe-1', product_id: 'party-product' }, error: null },
        { data: null, error: null },
      ],
      recipe_items: [{ data: [], error: null }],
      products: [{ data: { id: 'dough-product', unit_of_measure_id: 'kg' }, error: null }],
    });

    await expect(assertRecipeItemReferencesAvailable(client, 'recipe-1', {
      rawMaterialId: null,
      productId: 'dough-product',
    })).rejects.toThrow('El producto no tiene una receta intermedia activa.');
  });
});
