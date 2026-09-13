import { describe, expect, it } from 'vitest';

import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

import { cancelCommercialInvoice, issueCommercialInvoice } from './invoice-repository';

describe('repositorio de facturación comercial', () => {
  it('emite con una única RPC transaccional y omite nulos opcionales', async () => {
    const calls: unknown[] = [];
    const client = { rpc: async (...args: unknown[]) => {
      calls.push(args);
      return { data: 'invoice-1', error: null };
    } } as unknown as TypedSupabaseClient;

    await expect(issueCommercialInvoice(client, {
      salesOrderId: 'order-1', dueDate: null, notes: null,
    })).resolves.toBe('invoice-1');
    expect(calls).toEqual([['issue_sales_invoice', { p_sales_order_id: 'order-1' }]]);
  });

  it('cancela mediante una RPC y conserva el error de dominio', async () => {
    const calls: unknown[] = [];
    const client = { rpc: async (...args: unknown[]) => {
      calls.push(args);
      return { data: null, error: { message: 'Invoice has registered payments.' } };
    } } as unknown as TypedSupabaseClient;

    await expect(cancelCommercialInvoice(client, 'invoice-1', 'Pedido devuelto'))
      .rejects.toThrow('Invoice has registered payments.');
    expect(calls).toEqual([['cancel_sales_invoice', {
      p_invoice_id: 'invoice-1', p_reason: 'Pedido devuelto',
    }]]);
  });
});
