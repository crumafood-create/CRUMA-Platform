import { describe, expect, it } from 'vitest';

import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

import { addSalesQuoteItem, convertSalesQuoteToOrder } from './sales-quote-repository';

describe('repositorio de cotizaciones', () => {
  it('delega la partida y sus importes a una sola RPC', async () => {
    const calls: unknown[] = [];
    const client = { rpc: async (...args: unknown[]) => {
      calls.push(args); return { data: 'item-1', error: null };
    } } as unknown as TypedSupabaseClient;
    await expect(addSalesQuoteItem(client, {
      quoteId: 'quote-1', productId: 'product-1', quantity: 2, unitPrice: 50,
      discount: 5, taxRate: 16, subtotal: 100, taxAmount: 15.2, total: 110.2,
    })).resolves.toBe('item-1');
    expect(calls).toEqual([['add_sales_quote_item', expect.objectContaining({
      p_quote_id: 'quote-1', p_tax_rate: 16,
    })]]);
  });

  it('convierte con una única RPC y no oculta errores', async () => {
    const client = ({
      rpc: async () => ({ data: null, error: { message: 'Quote was already converted.' } }),
    }) as unknown as TypedSupabaseClient;
    await expect(convertSalesQuoteToOrder(client, 'quote-1')).rejects.toThrow('Quote was already converted.');
  });
});
