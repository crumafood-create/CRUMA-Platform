import { describe, expect, it } from 'vitest';

import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

import {
  assertInventoryLocationCanBeDeleted,
  assertInventoryLocationSlugAvailable,
} from './inventory-location-repository';

type TableName =
  | 'inventory_locations'
  | 'product_lots'
  | 'raw_material_lots'
  | 'picking_order_items';
type Result = { data: unknown; error: { message: string } | null };
type QueryBuilder = Promise<Result> & {
  select: () => QueryBuilder;
  eq: () => QueryBuilder;
  neq: (field: string, value: string) => QueryBuilder;
  is: () => QueryBuilder;
  limit: () => QueryBuilder;
  maybeSingle: () => Promise<Result>;
};

function clientWith(fixtures: Partial<Record<TableName, Result>>) {
  const calls: TableName[] = [];
  const exclusions: string[] = [];

  const client = {
    from(table: TableName) {
      calls.push(table);

      const result = fixtures[table] ?? { data: [], error: null };
      let query: QueryBuilder;

      query = Object.assign(Promise.resolve(result), {
        select() { return query; },
        eq() { return query; },
        neq(_field: string, value: string) { exclusions.push(value); return query; },
        is() { return query; },
        limit() { return query; },
        maybeSingle() { return Promise.resolve(result); },
      });

      return query;
    },
  } as unknown as TypedSupabaseClient;

  return { client, calls, exclusions };
}

describe('repositorio tipado de ubicaciones de inventario', () => {
  it('permite códigos sin duplicados activos', async () => {
    const { client, calls } = clientWith({
      inventory_locations: { data: null, error: null },
    });

    await assertInventoryLocationSlugAvailable(client, 'A-01');

    expect(calls).toEqual(['inventory_locations']);
  });

  it('excluye la ubicación actual durante ediciones', async () => {
    const { client, exclusions } = clientWith({
      inventory_locations: { data: null, error: null },
    });

    await assertInventoryLocationSlugAvailable(client, 'A-01', 'location-1');

    expect(exclusions).toEqual(['location-1']);
  });

  it('rechaza códigos duplicados', async () => {
    const { client } = clientWith({
      inventory_locations: { data: { id: 'location-2' }, error: null },
    });

    await expect(assertInventoryLocationSlugAvailable(client, 'A-01')).rejects.toThrow(
      'Ya existe una ubicación activa con ese código.',
    );
  });

  it('propaga errores al verificar códigos duplicados', async () => {
    const { client } = clientWith({
      inventory_locations: { data: null, error: { message: 'Ubicaciones no disponibles.' } },
    });

    await expect(assertInventoryLocationSlugAvailable(client, 'A-01')).rejects.toThrow(
      'Ubicaciones no disponibles.',
    );
  });

  it('verifica las tres tablas relacionadas antes de eliminar', async () => {
    const { client, calls } = clientWith({});

    await assertInventoryLocationCanBeDeleted(client, 'location-1');

    expect(calls).toEqual(['product_lots', 'raw_material_lots', 'picking_order_items']);
  });

  it.each(['product_lots', 'raw_material_lots', 'picking_order_items'] as const)(
    'bloquea ubicaciones referenciadas por %s',
    async (table) => {
      const { client } = clientWith({
        [table]: { data: [{ id: 'reference-1' }], error: null },
      });

      await expect(assertInventoryLocationCanBeDeleted(client, 'location-1')).rejects.toThrow(
        'La ubicación tiene lotes o referencias de picking asociadas.',
      );
    },
  );

  it('propaga errores al comprobar referencias activas', async () => {
    const { client } = clientWith({
      raw_material_lots: { data: null, error: { message: 'Lotes no disponibles.' } },
    });

    await expect(assertInventoryLocationCanBeDeleted(client, 'location-1')).rejects.toThrow(
      'Lotes no disponibles.',
    );
  });
});
