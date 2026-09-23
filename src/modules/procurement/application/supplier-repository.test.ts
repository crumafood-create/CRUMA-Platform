import { describe, expect, it } from 'vitest';

import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

import {
  assertSupplierCanBeDeactivated,
  assertSupplierTaxIdAvailable,
} from './supplier-repository';

type TableName = 'suppliers' | 'purchase_orders' | 'raw_materials';

type QueryResult = {
  data: unknown;
  error: { message: string } | null;
};

type QueryCall = {
  table: TableName;
  columns: string;
};

type QueryBuilder = Promise<QueryResult> & {
  select: (columns: string) => QueryBuilder;
  eq: (column: string, value: unknown) => QueryBuilder;
  is: (column: string, value: unknown) => QueryBuilder;
  neq: (column: string, value: unknown) => QueryBuilder;
  ilike: (column: string, value: unknown) => QueryBuilder;
  limit: (count: number) => QueryBuilder;
  maybeSingle: () => Promise<QueryResult>;
};

function clientWith(fixtures: Partial<Record<TableName, QueryResult>>) {
  const calls: QueryCall[] = [];
  const filters: Array<[string, unknown]> = [];

  const client = {
    from(table: TableName) {
      const fallback = table === 'suppliers' ? null : [];
      const result = fixtures[table] ?? { data: fallback, error: null };
      const call = { table, columns: '' };

      calls.push(call);

      const filter = (column: string, value: unknown) => {
        filters.push([column, value]);
        return query;
      };

      const query: QueryBuilder = Object.assign(Promise.resolve(result), {
        select(columns: string) {
          call.columns = columns;
          return query;
        },
        eq: filter,
        is: filter,
        neq: filter,
        ilike: filter,
        limit() {
          return query;
        },
        maybeSingle() {
          return Promise.resolve(result);
        },
      });

      return query;
    },
  } as unknown as TypedSupabaseClient;

  return { client, calls, filters };
}

describe('RFC único de proveedores', () => {
  it('omite la consulta cuando no existe RFC', async () => {
    const { client, calls } = clientWith({});

    await assertSupplierTaxIdAvailable(client, null);

    expect(calls).toEqual([]);
  });

  it('acepta RFC disponibles y excluye al proveedor editado', async () => {
    const { client, filters } = clientWith({});

    await assertSupplierTaxIdAvailable(client, 'ABC010101AB1', 'supplier-1');

    expect(filters).toContainEqual(['tax_id', 'ABC010101AB1']);
    expect(filters).toContainEqual(['id', 'supplier-1']);
  });

  it('rechaza RFC duplicados', async () => {
    const { client } = clientWith({ suppliers: { data: { id: 'supplier-2' }, error: null } });

    await expect(assertSupplierTaxIdAvailable(client, 'ABC010101AB1')).rejects.toThrow(
      'Ya existe un proveedor con ese RFC.',
    );
  });

  it('propaga errores al verificar RFC', async () => {
    const { client } = clientWith({
      suppliers: { data: null, error: { message: 'Proveedores no disponibles.' } },
    });

    await expect(assertSupplierTaxIdAvailable(client, 'ABC010101AB1')).rejects.toThrow(
      'Proveedores no disponibles.',
    );
  });
});

describe('desactivación segura de proveedores', () => {
  it('comprueba órdenes abiertas y materias primas activas', async () => {
    const { client, calls, filters } = clientWith({});

    await assertSupplierCanBeDeactivated(client, 'supplier-1');

    expect(calls.map((c) => c.table)).toEqual(['purchase_orders', 'raw_materials']);
    expect(filters).toContainEqual(['deleted_at', null]);
    expect(filters).toContainEqual(['is_active', true]);
  });

  it.each(['purchase_orders', 'raw_materials'] as const)(
    'bloquea referencias activas en %s',
    async (table) => {
      const { client } = clientWith({ [table]: { data: [{ id: 'reference-1' }], error: null } });

      await expect(assertSupplierCanBeDeactivated(client, 'supplier-1')).rejects.toThrow(
        'El proveedor tiene órdenes abiertas o materias primas activas asociadas.',
      );
    },
  );

  it('propaga errores de referencias', async () => {
    const { client } = clientWith({
      purchase_orders: { data: null, error: { message: 'Órdenes no disponibles.' } },
    });

    await expect(assertSupplierCanBeDeactivated(client, 'supplier-1')).rejects.toThrow(
      'Órdenes no disponibles.',
    );
  });
});