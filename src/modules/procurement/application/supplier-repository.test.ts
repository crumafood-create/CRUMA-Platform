import { describe, expect, it } from 'vitest';

import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

import { assertSupplierTaxIdAvailable } from './supplier-repository';

type TableName = 'suppliers';

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
  neq: (column: string, value: unknown) => QueryBuilder;
  ilike: (column: string, value: unknown) => QueryBuilder;
  limit: (count: number) => QueryBuilder;
  maybeSingle: () => Promise<QueryResult>;
};

function clientWith(fixtures: Partial<Record<TableName, QueryResult>>) {
  const calls: QueryCall[] = [];

  const client = {
    from(table: TableName) {
      const result = fixtures[table] ?? { data: null, error: null };
      const call = { table, columns: '' };

      calls.push(call);

      const query: QueryBuilder = Object.assign(Promise.resolve(result), {
        select(columns: string) {
          call.columns = columns;
          return query;
        },
        eq() {
          return query;
        },
        neq() {
          return query;
        },
        ilike() {
          return query;
        },
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

  return { client, calls };
}

describe('repositorio tipado de proveedores', () => {
  it('verifica disponibilidad de RFC / Identificación Fiscal de proveedor', async () => {
    const { client, calls } = clientWith({
      suppliers: {
        data: null,
        error: null,
      },
    });

    await expect(assertSupplierTaxIdAvailable(client, 'RFC123456789')).resolves.not.toThrow();
    expect(calls.map((c) => c.table)).toEqual(['suppliers']);
  });
});
