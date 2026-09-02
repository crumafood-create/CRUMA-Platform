import { describe, expect, it } from 'vitest';

import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

import {
  assertSupplierCanBeDeactivated,
  assertSupplierTaxIdAvailable,
} from './supplier-repository';

type TableName = 'suppliers' | 'purchase_orders' | 'raw_materials';
type Result = { data: unknown; error: { message: string } | null };
type Query = Promise<Result> & {
  select: () => Query;
  eq: (field: string, value: unknown) => Query;
  is: (field: string, value: unknown) => Query;
  ilike: (field: string, value: string) => Query;
  neq: (field: string, value: string) => Query;
  limit: () => Query;
  maybeSingle: () => Promise<Result>;
};

function clientWith(fixtures: Partial<Record<TableName, Result>>) {
  const calls: TableName[] = [];
  const filters: Array<[string, unknown]> = [];
  const client = {
    from(table: TableName) {
      calls.push(table);
      const fallback = table === 'suppliers' ? null : [];
      const result = fixtures[table] ?? { data: fallback, error: null };
      let query: Query;
      const filter = (field: string, value: unknown) => { filters.push([field, value]); return query; };

      query = Object.assign(Promise.resolve(result), {
        select: () => query,
        eq: filter,
        is: filter,
        ilike: filter,
        neq: filter,
        limit: () => query,
        maybeSingle: () => Promise.resolve(result),
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
    expect(calls).toEqual(['purchase_orders', 'raw_materials']);
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
