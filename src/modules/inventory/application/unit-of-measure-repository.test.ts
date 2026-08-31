import { describe, expect, it } from 'vitest';

import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

import {
  assertUnitOfMeasureCanBeDeleted,
  assertUnitOfMeasureCodeAvailable,
} from './unit-of-measure-repository';

type TableName = 'units_of_measure' | 'products' | 'raw_materials' | 'recipes';
type Result = { data: unknown; error: { message: string } | null };
type QueryBuilder = Promise<Result> & {
  select: () => QueryBuilder;
  eq: () => QueryBuilder;
  neq: (_field: string, value: string) => QueryBuilder;
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

describe('repositorio tipado de unidades de medida', () => {
  it('acepta códigos disponibles', async () => {
    const { client } = clientWith({ units_of_measure: { data: null, error: null } });

    await expect(assertUnitOfMeasureCodeAvailable(client, 'kg')).resolves.toBeUndefined();
  });

  it('excluye la unidad actual durante ediciones', async () => {
    const { client, exclusions } = clientWith({
      units_of_measure: { data: null, error: null },
    });

    await assertUnitOfMeasureCodeAvailable(client, 'kg', 'unit-1');

    expect(exclusions).toEqual(['unit-1']);
  });

  it('rechaza códigos duplicados incluso si pertenecen a filas eliminadas', async () => {
    const { client } = clientWith({
      units_of_measure: { data: { id: 'unit-2' }, error: null },
    });

    await expect(assertUnitOfMeasureCodeAvailable(client, 'kg')).rejects.toThrow(
      'Ya existe una unidad con ese código.',
    );
  });

  it('propaga errores al verificar códigos', async () => {
    const { client } = clientWith({
      units_of_measure: { data: null, error: { message: 'Unidades no disponibles.' } },
    });

    await expect(assertUnitOfMeasureCodeAvailable(client, 'kg')).rejects.toThrow(
      'Unidades no disponibles.',
    );
  });

  it('verifica productos, materias primas y recetas antes de eliminar', async () => {
    const { client, calls } = clientWith({});

    await assertUnitOfMeasureCanBeDeleted(client, 'unit-1');

    expect(calls).toEqual(['products', 'raw_materials', 'recipes']);
  });

  it.each(['products', 'raw_materials', 'recipes'] as const)(
    'bloquea unidades referenciadas por %s',
    async (table) => {
      const { client } = clientWith({
        [table]: { data: [{ id: 'reference-1' }], error: null },
      });

      await expect(assertUnitOfMeasureCanBeDeleted(client, 'unit-1')).rejects.toThrow(
        'La unidad está asociada con productos, materias primas o recetas activas.',
      );
    },
  );

  it('propaga errores al comprobar referencias', async () => {
    const { client } = clientWith({
      recipes: { data: null, error: { message: 'Recetas no disponibles.' } },
    });

    await expect(assertUnitOfMeasureCanBeDeleted(client, 'unit-1')).rejects.toThrow(
      'Recetas no disponibles.',
    );
  });
});
