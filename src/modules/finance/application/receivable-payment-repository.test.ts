import { describe, expect, it } from 'vitest';
import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';
import { registerReceivablePayment } from './receivable-payment-repository';

describe('registro atómico de abonos', () => {
  it('delega toda la transacción a una única RPC', async () => {
    const calls: unknown[] = [];
    const rawClient: unknown = { rpc: async (...args: unknown[]) => {
      calls.push(args); return { data: 'payment-1', error: null };
    } };
    const client = rawClient as TypedSupabaseClient;
    await expect(registerReceivablePayment(client, {
      accountId: 'account-1', paymentDate: '2026-09-13', amount: 10,
      paymentMethod: 'cash', reference: 'CASH-1', notes: null,
    })).resolves.toBe('payment-1');
    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual(['register_receivable_payment', expect.objectContaining({ p_amount: 10 })]);
  });

  it('no oculta errores transaccionales', async () => {
    const rawClient: unknown = {
      rpc: async () => ({ data: null, error: { message: 'Saldo insuficiente.' } }),
    };
    const client = rawClient as TypedSupabaseClient;
    await expect(registerReceivablePayment(client, {
      accountId: 'account-1', paymentDate: '2026-09-13', amount: 10,
      paymentMethod: 'cash', reference: 'CASH-1', notes: null,
    })).rejects.toThrow('Saldo insuficiente.');
  });
});
