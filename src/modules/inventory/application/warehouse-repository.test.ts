import { describe, expect, it } from 'vitest';

import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

import {
  assertWarehouseCanBeDeleted,
  assertWarehouseCodeAvailable,
  WAREHOUSE_REFERENCE_TABLES,
} from './warehouse-repository';

type TableName = (typeof WAREHOUSE_REFERENCE_TABLES)[number] | 'warehouses';
type Result = { data: unknown; error: { message: string } | null };
type Query = Promise<Result> & {
  select: () => Query;
  eq: () => Query;
  ilike: () => Query;
  neq: (_field: string, value: string) => Query;
  limit: () => Query;
  maybeSingle: () => Promise<Result>;
};

function clientWith(fixtures: Partial<Record<TableName, Result>>) {
  const calls: TableName[] = [];
  const exclusions: string[] = [];
  const client = {
    from(table: TableName) {
      calls.push(table);
      const fallback = table === 'warehouses' ? null : [];
      const result = fixtures[table] ?? { data: fallback, error: null };
      let query: Query;

      query = Object.assign(Promise.resolve(result), {
        select() { return query; },
        eq() { return query; },
        ilike() { return query; },
        neq(_field: string, value: string) { exclusions.push(value); return query; },
        limit() { return query; },
        maybeSingle() { return Promise.resolve(result); },
      });

      return query;
    },
  } as unknown as TypedSupabaseClient;

  return { client, calls, exclusions };
}

describe('códigos de almacén', () => {
  it('acepta códigos disponibles', async () => {
    const { client } = clientWith({});

    await expect(assertWarehouseCodeAvailable(client, 'MAIN')).resolves.toBeUndefined();
  });

  it('excluye el almacén actual durante ediciones', async () => {
    const { client, exclusions } = clientWith({});

    await assertWarehouseCodeAvailable(client, 'MAIN', 'warehouse-1');

    expect(exclusions).toEqual(['warehouse-1']);
  });

  it('rechaza códigos duplicados sin depender de mayúsculas', async () => {
    const { client } = clientWith({ warehouses: { data: { id: 'warehouse-2' }, error: null } });

    await expect(assertWarehouseCodeAvailable(client, 'MAIN')).rejects.toThrow(
      'Ya existe un almacén con ese código.',
    );
  });

  it('propaga errores al verificar códigos', async () => {
    const { client } = clientWith({
      warehouses: { data: null, error: { message: 'Almacenes no disponibles.' } },
    });

    await expect(assertWarehouseCodeAvailable(client, 'MAIN')).rejects.toThrow(
      'Almacenes no disponibles.',
    );
  });
});

describe('eliminación segura de almacenes', () => {
  it('comprueba las nueve relaciones operativas', async () => {
    const { client, calls } = clientWith({});

    await assertWarehouseCanBeDeleted(client, 'warehouse-1');

    expect(calls).toEqual([...WAREHOUSE_REFERENCE_TABLES]);
  });

  it.each(WAREHOUSE_REFERENCE_TABLES)(
    'bloquea almacenes referenciados por %s',
    async (table) => {
      const { client } = clientWith({
        [table]: { data: [{ id: 'reference-1' }], error: null },
      });

      await expect(assertWarehouseCanBeDeleted(client, 'warehouse-1')).rejects.toThrow(
        'El almacén tiene operaciones o existencias asociadas.',
      );
    },
  );

  it('propaga errores al comprobar referencias', async () => {
    const { client } = clientWith({
      production_orders: { data: null, error: { message: 'Órdenes no disponibles.' } },
    });

    await expect(assertWarehouseCanBeDeleted(client, 'warehouse-1')).rejects.toThrow(
      'Órdenes no disponibles.',
    );
  });
});
