import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const rpc = vi.fn();
  return {
    authorize: vi.fn(),
    assertItemCanBeAdded: vi.fn(),
    rpc,
    supabase: { rpc },
  };
});

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/modules/identity/guards/action.guard', () => ({
  requireTypedAuthorizedAction: mocks.authorize,
}));
vi.mock('@/modules/procurement/application/purchase-order-repository', () => ({
  assertPurchaseOrderItemCanBeAdded: mocks.assertItemCanBeAdded,
}));

import { revalidatePath } from 'next/cache';

import { createPurchaseOrderItem } from './actions';

const ORDER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const MATERIAL_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.authorize.mockResolvedValue({ supabase: mocks.supabase });
  mocks.rpc.mockResolvedValue({ error: null });
});

it('createPurchaseOrderItem_persistsSubmittedValuesWithOneAtomicRpc', async () => {
  const formData = new FormData();
  formData.set('purchase_order_id', ORDER_ID);
  formData.set('raw_material_id', MATERIAL_ID);
  formData.set('quantity', '8.25');
  formData.set('unit_cost', '17.40');

  await createPurchaseOrderItem(formData);

  expect(mocks.assertItemCanBeAdded).toHaveBeenCalledWith(
    mocks.supabase,
    ORDER_ID,
    MATERIAL_ID,
  );
  expect(mocks.rpc).toHaveBeenCalledTimes(1);
  expect(mocks.rpc).toHaveBeenCalledWith('add_purchase_order_item', {
    p_order_id: ORDER_ID,
    p_raw_material_id: MATERIAL_ID,
    p_quantity: 8.25,
    p_unit_cost: 17.4,
  });
  expect(revalidatePath).toHaveBeenCalledWith(`/purchase-orders/${ORDER_ID}/items`);
  expect(revalidatePath).toHaveBeenCalledWith(`/purchase-orders/${ORDER_ID}`);
});
