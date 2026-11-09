import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

import { getReceivingOrders } from './receiving.service';

vi.mock('@/infrastructure/integrations/supabase/server', () => ({
  createTypedClient: vi.fn(),
}));

const orderBy = vi.fn();
const onlyReceivableStatuses = vi.fn(() => ({ order: orderBy }));
const onlyActiveOrders = vi.fn(() => ({ in: onlyReceivableStatuses }));
const select = vi.fn(() => ({ is: onlyActiveOrders }));
const from = vi.fn(() => ({ select }));

describe('getReceivingOrders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    orderBy.mockResolvedValue({
      data: [{
        id: 'partial-order-id',
        order_number: 'PO-TEST-PARTIAL',
        status: 'partially_received',
        created_at: '2026-11-09T12:00:00Z',
        supplier: { name: 'Proveedor de prueba' },
      }],
      error: null,
    });
    vi.mocked(createTypedClient).mockResolvedValue({ from } as never);
  });

  it('returns partial orders using typed purchase-order fields and the supplier relation', async () => {
    const orders = await getReceivingOrders();

    expect(orders).toEqual([{
      id: 'partial-order-id',
      order_number: 'PO-TEST-PARTIAL',
      supplier_name: 'Proveedor de prueba',
      status: 'partially_received',
      created_at: '2026-11-09T12:00:00Z',
    }]);
    expect(from).toHaveBeenCalledWith('purchase_orders');
    expect(select).toHaveBeenCalledWith(
      'id, order_number, status, created_at, supplier:suppliers!purchase_orders_supplier_id_fkey(name)',
    );
    expect(onlyReceivableStatuses).toHaveBeenCalledWith(
      'status',
      ['released', 'partially_received'],
    );
  });
});
