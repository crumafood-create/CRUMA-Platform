import { describe, expect, it } from 'vitest';

import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

import { assertWarehouseCodeAvailable } from './warehouse-repository';

type TableName = 'warehouses';

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
        maybeSingle() {
          return Promise.resolve(result);
        },
      });

      return query;
    },
  } as unknown as TypedSupabaseClient;

  return { client, calls };
}

describe('repositorio tipado de almacenes', () => {
  it('verifica disponibilidad de código de almacén', async () => {
    const { client, calls } = clientWith({
      warehouses: {
        data: null,
        error: null,
      },
    });

    await expect(assertWarehouseCodeAvailable(client, 'ALM-NEW')).resolves.not.toThrow();
    expect(calls.map((c) => c.table)).toEqual(['warehouses']);
  });
});
