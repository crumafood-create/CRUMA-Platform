import { describe, expect, it } from 'vitest';

import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

import { assertFlavorCanBeDeleted } from './flavor-catalog-repository';

type Result = { data: unknown; error: { message: string } | null };
type QueryBuilder = Promise<Result> & {
  select: () => QueryBuilder;
  eq: () => QueryBuilder;
  is: () => QueryBuilder;
  limit: () => QueryBuilder;
};

function clientWith(result: Result) {
  const calls: string[] = [];
  let query: QueryBuilder;

  query = Object.assign(Promise.resolve(result), {
    select() { return query; },
    eq() { return query; },
    is() { return query; },
    limit() { return query; },
  });

  const client = {
    from(table: string) {
      calls.push(table);

      return query;
    },
  } as unknown as TypedSupabaseClient;

  return { client, calls };
}

describe('repositorio tipado del catálogo de sabores', () => {
  it('permite eliminar sabores sin productos activos asociados', async () => {
    const { client, calls } = clientWith({ data: [], error: null });

    await assertFlavorCanBeDeleted(client, 'flavor-1');

    expect(calls).toEqual(['products']);
  });

  it('bloquea eliminar sabores utilizados por productos activos', async () => {
    const { client } = clientWith({ data: [{ id: 'product-1' }], error: null });

    await expect(assertFlavorCanBeDeleted(client, 'flavor-1')).rejects.toThrow(
      'El sabor tiene productos activos asociados.',
    );
  });

  it('propaga errores al comprobar productos asociados', async () => {
    const { client } = clientWith({
      data: null,
      error: { message: 'Productos no disponibles.' },
    });

    await expect(assertFlavorCanBeDeleted(client, 'flavor-1')).rejects.toThrow(
      'Productos no disponibles.',
    );
  });
});
