import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const rpc = vi.fn();
  const from = vi.fn();
  return {
    authorize: vi.fn(),
    rpc,
    from,
    supabase: { rpc, from },
    assertSupplierCanReceiveOrders: vi.fn(),
  };
});

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('@/modules/identity/guards/action.guard', () => ({
  requireTypedAuthorizedAction: mocks.authorize,
}));
vi.mock('@/modules/procurement/application/purchase-order-repository', () => ({
  assertPurchaseOrderCanCancel: vi.fn(),
  assertPurchaseOrderCanRelease: vi.fn(),
  assertSupplierCanReceiveOrders: mocks.assertSupplierCanReceiveOrders,
}));

import { revalidatePath } from 'next/cache';

import { updatePurchaseOrderFreight, updatePurchaseOrderSupplier } from './actions';

const ORDER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.authorize.mockResolvedValue({ supabase: mocks.supabase });
  mocks.rpc.mockResolvedValue({ error: null });
  mocks.assertSupplierCanReceiveOrders.mockResolvedValue(undefined);
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

it('updatePurchaseOrderSupplier_updatesOnlyTheSupplierOnAnExistingDraftRow', async () => {
  const maybeSingle = vi.fn().mockResolvedValue({ data: { id: ORDER_ID }, error: null });
  const select = vi.fn().mockReturnValue({ maybeSingle });
  const eq = vi.fn().mockReturnThis();
  const update = vi.fn().mockReturnValue({ eq, select });
  mocks.from.mockReturnValue({ update });
  const formData = new FormData();
  formData.set('purchase_order_id', ORDER_ID);
  formData.set('supplier_id', 'supplier-2');

  await updatePurchaseOrderSupplier(formData);

  expect(mocks.authorize).toHaveBeenCalledTimes(1);
  expect(mocks.assertSupplierCanReceiveOrders).toHaveBeenCalledWith(
    mocks.supabase,
    'supplier-2',
  );
  expect(update).toHaveBeenCalledWith({
    supplier_id: 'supplier-2',
    updated_at: expect.any(String),
  });
  expect(eq).toHaveBeenNthCalledWith(1, 'id', ORDER_ID);
  expect(eq).toHaveBeenNthCalledWith(2, 'status', 'draft');
  expect(select).toHaveBeenCalledWith('id');
  expect(maybeSingle).toHaveBeenCalledTimes(1);
  expect(mocks.rpc).not.toHaveBeenCalled();
});

it('updatePurchaseOrderSupplier_rejectsUnavailableSuppliersWithoutWriting', async () => {
  mocks.assertSupplierCanReceiveOrders.mockRejectedValueOnce(
    new Error('El proveedor no está disponible para nuevas órdenes.'),
  );
  const update = vi.fn();
  mocks.from.mockReturnValue({ update });
  const formData = new FormData();
  formData.set('purchase_order_id', ORDER_ID);
  formData.set('supplier_id', 'supplier-inactive');

  await expect(updatePurchaseOrderSupplier(formData)).rejects.toThrow(
    'El proveedor no está disponible para nuevas órdenes.',
  );

  expect(mocks.assertSupplierCanReceiveOrders).toHaveBeenCalledWith(
    mocks.supabase,
    'supplier-inactive',
  );
  expect(update).not.toHaveBeenCalled();
});

it('updatePurchaseOrderSupplier_rejectsMissingSupplierBeforeAnyWrite', async () => {
  const update = vi.fn();
  mocks.from.mockReturnValue({ update });
  const formData = new FormData();
  formData.set('purchase_order_id', ORDER_ID);

  await expect(updatePurchaseOrderSupplier(formData)).rejects.toThrow(
    'El campo supplier_id es obligatorio.',
  );

  expect(mocks.assertSupplierCanReceiveOrders).not.toHaveBeenCalled();
  expect(update).not.toHaveBeenCalled();
});

it('updatePurchaseOrderSupplier_rejectsWhenTheOrderIsNoLongerDraft', async () => {
  const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  const select = vi.fn().mockReturnValue({ maybeSingle });
  const eq = vi.fn().mockReturnThis();
  const update = vi.fn().mockReturnValue({ eq, select });
  mocks.from.mockReturnValue({ update });
  const formData = new FormData();
  formData.set('purchase_order_id', ORDER_ID);
  formData.set('supplier_id', 'supplier-2');

  await expect(updatePurchaseOrderSupplier(formData)).rejects.toThrow(
    'No fue posible cambiar el proveedor de la orden de compra.',
  );

  expect(eq).toHaveBeenNthCalledWith(2, 'status', 'draft');
  expect(maybeSingle).toHaveBeenCalledTimes(1);
});
