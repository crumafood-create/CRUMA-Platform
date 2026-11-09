import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const rpc = vi.fn();
  return {
    authorize: vi.fn(),
    rpc,
    supabase: { rpc },
  };
});

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('@/modules/identity/guards/action.guard', () => ({
  requireTypedAuthorizedAction: mocks.authorize,
}));

import { revalidatePath } from 'next/cache';

import { updatePurchaseOrderFreight } from './actions';

const ORDER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.authorize.mockResolvedValue({ supabase: mocks.supabase });
  mocks.rpc.mockResolvedValue({ error: null });
});

it('updatePurchaseOrderFreight_persistsTheSubmittedAmountThroughTheDraftGuard', async () => {
  const formData = new FormData();
  formData.set('purchase_order_id', ORDER_ID);
  formData.set('freight_amount', '0');

  await updatePurchaseOrderFreight(formData);

  expect(mocks.authorize).toHaveBeenCalledTimes(1);
  expect(mocks.rpc).toHaveBeenCalledWith('update_purchase_order_freight', {
    p_order_id: ORDER_ID,
    p_freight_amount: 0,
  });
  expect(revalidatePath).toHaveBeenCalledWith('/purchase-orders');
  expect(revalidatePath).toHaveBeenCalledWith(`/purchase-orders/${ORDER_ID}`);
});

it('updatePurchaseOrderFreight_rejectsInvalidAmountBeforeCallingTheDatabase', async () => {
  const formData = new FormData();
  formData.set('purchase_order_id', ORDER_ID);
  formData.set('freight_amount', '-1');

  await expect(updatePurchaseOrderFreight(formData)).rejects.toThrow();
  expect(mocks.rpc).not.toHaveBeenCalled();
});
