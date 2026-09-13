import { describe, expect, it } from 'vitest';
import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';
import { assertCustomerCanBeDeactivated, assertCustomerIdentityAvailable } from './customer-repository';

type Result = { data: unknown; error: { message: string } | null };
function client(fixtures: Record<string, Result> = {}) {
  const calls: string[] = [];
  return { calls, value: { from(table: string) {
    calls.push(table); const result = fixtures[table] ?? { data: table === 'customers' ? null : [], error: null };
    let query: any = Promise.resolve(result);
    ['select', 'eq', 'is', 'ilike', 'neq', 'gt', 'limit'].forEach((method) => { query[method] = () => query; });
    query.maybeSingle = () => Promise.resolve(result);
    return query;
  } } as unknown as TypedSupabaseClient };
}

describe('identidad y desactivación de clientes', () => {
  it('rechaza RFC o código duplicados', async () => {
    const { value } = client({ customers: { data: { id: '2' }, error: null } });
    await expect(assertCustomerIdentityAvailable(value, 'CLI-1', 'ABC010101AB1')).rejects.toThrow(
      'Ya existe un cliente con ese código o RFC.',
    );
  });

  it('comprueba órdenes y cuentas por cobrar antes de desactivar', async () => {
    const { value, calls } = client();
    await assertCustomerCanBeDeactivated(value, 'customer-1');
    expect(calls).toEqual(['sales_orders', 'accounts_receivable']);
  });

  it.each(['sales_orders', 'accounts_receivable'])('bloquea referencias en %s', async (table) => {
    const { value } = client({ [table]: { data: [{ id: '1' }], error: null } });
    await expect(assertCustomerCanBeDeactivated(value, 'customer-1')).rejects.toThrow(
      'El cliente tiene órdenes abiertas o saldos pendientes.',
    );
  });
});
