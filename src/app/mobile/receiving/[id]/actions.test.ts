import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  authorize: vi.fn(),
  rpc: vi.fn(function (this: { rest?: object } | undefined) {
    if (!this?.rest) {
      throw new TypeError("Cannot read properties of undefined (reading 'rest')");
    }

    return Promise.resolve({ data: 'order-1', error: null });
  }),
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/modules/identity/guards/action.guard', () => ({
  requireTypedAuthorizedAction: mocks.authorize,
}));

import { confirmReceiving } from './actions';

describe('confirmReceiving', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authorize.mockResolvedValue({
      supabase: { rest: {}, rpc: mocks.rpc },
    });
  });

  it('invokes the receipt RPC with its Supabase client context', async () => {
    await expect(confirmReceiving({
      purchaseOrderItemId: '11111111-1111-4111-8111-111111111111',
      quantityReceived: 5,
      lotNumber: 'LOT-001',
      expirationDate: '2026-10-31',
      inventoryLocationId: '22222222-2222-4222-8222-222222222222',
      idempotencyKey: '33333333-3333-4333-8333-333333333333',
    })).resolves.toBeUndefined();

    expect(mocks.rpc).toHaveBeenCalledWith('receive_purchase_order_lot', {
      p_item_id: '11111111-1111-4111-8111-111111111111',
      p_quantity: 5,
      p_lot_number: 'LOT-001',
      p_expiration_date: '2026-10-31',
      p_inventory_location_id: '22222222-2222-4222-8222-222222222222',
      p_idempotency_key: '33333333-3333-4333-8333-333333333333',
    });
  });
});
