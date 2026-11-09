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

import {
  createPurchaseOrderItem,
  deletePurchaseOrderItem,
  updatePurchaseOrderItem,
} from './actions';

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
  formData.set('presentation_mode', 'base_unit');

  await createPurchaseOrderItem(formData);

  expect(mocks.assertItemCanBeAdded).toHaveBeenCalledWith(
    mocks.supabase,
    ORDER_ID,
    MATERIAL_ID,
  );
  expect(mocks.rpc).toHaveBeenCalledTimes(1);
  expect(mocks.rpc).toHaveBeenCalledWith('add_purchase_order_item_with_presentation', {
    p_order_id: ORDER_ID,
    p_raw_material_id: MATERIAL_ID,
    p_presentation_mode: 'base_unit',
    p_purchase_quantity: 8.25,
    p_base_quantity_per_presentation: 1,
    p_purchase_unit_price: 17.4,
  });
  expect(revalidatePath).toHaveBeenCalledWith(`/purchase-orders/${ORDER_ID}/items`);
  expect(revalidatePath).toHaveBeenCalledWith(`/purchase-orders/${ORDER_ID}`);
});

it('createPurchaseOrderItem_sendsPackageCountContentAndCommercialPrice', async () => {
  const formData = new FormData();
  formData.set('purchase_order_id', ORDER_ID);
  formData.set('raw_material_id', MATERIAL_ID);
  formData.set('presentation_mode', 'sealed_package');
  formData.set('quantity', '2');
  formData.set('base_quantity_per_presentation', '25');
  formData.set('unit_cost', '620');

  await createPurchaseOrderItem(formData);

  expect(mocks.rpc).toHaveBeenCalledWith('add_purchase_order_item_with_presentation', {
    p_order_id: ORDER_ID,
    p_raw_material_id: MATERIAL_ID,
    p_presentation_mode: 'sealed_package',
    p_purchase_quantity: 2,
    p_base_quantity_per_presentation: 25,
    p_purchase_unit_price: 620,
  });
});

it('updatePurchaseOrderItem_sendsPresentationTermsToTheAtomicDraftGuard', async () => {
  const formData = new FormData();
  formData.set('purchase_order_id', ORDER_ID);
  formData.set('presentation_mode', 'sealed_package');
  formData.set('quantity', '2');
  formData.set('base_quantity_per_presentation', '25');
  formData.set('unit_cost', '620');

  await updatePurchaseOrderItem('cccccccc-cccc-4ccc-8ccc-cccccccccccc', formData);

  expect(mocks.rpc).toHaveBeenCalledWith('update_purchase_order_item_presentation', {
    p_item_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    p_presentation_mode: 'sealed_package',
    p_purchase_quantity: 2,
    p_base_quantity_per_presentation: 25,
    p_purchase_unit_price: 620,
  });
});

it('deletePurchaseOrderItem_callsTheDraftGuardedRemovalRpc', async () => {
  const itemId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  await deletePurchaseOrderItem(itemId, ORDER_ID);

  expect(mocks.rpc).toHaveBeenCalledWith('delete_purchase_order_item', {
    p_item_id: itemId,
  });
});
