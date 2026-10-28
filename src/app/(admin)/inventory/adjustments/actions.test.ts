import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  authorize: vi.fn(),
  rpc: vi.fn(),
  from: vi.fn(),
  insert: vi.fn(),
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('@/modules/identity/guards/action.guard', () => ({
  requireTypedAuthorizedAction: mocks.authorize,
}));

import { adjustRawMaterialLotQuantity } from './actions';

describe('adjustRawMaterialLotQuantity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rpc.mockResolvedValue({ data: 'movement-id', error: null });
    mocks.insert.mockResolvedValue({ error: null });
    mocks.from.mockReturnValue({ insert: mocks.insert });
    mocks.authorize.mockResolvedValue({
      supabase: { rpc: mocks.rpc, from: mocks.from },
    });
  });

  it('llama la RPC autorizada con el lote y los datos del ajuste', async () => {
    const formData = new FormData();
    formData.set('lot_id', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
    formData.set('movement_type', 'entry');
    formData.set('quantity', '2.5');
    formData.set('reason', 'Corrección de conteo');

    await adjustRawMaterialLotQuantity(formData);

    expect(mocks.authorize).toHaveBeenCalledWith('inventory.adjustment.create');
    expect(mocks.rpc).toHaveBeenCalledWith('adjust_raw_material_lot_quantity', {
      p_lot_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      p_movement_type: 'entry',
      p_quantity: 2.5,
      p_reason: 'Corrección de conteo',
    });
  });

  it('createInventoryAdjustment_rejectsRawMaterialBeforeAnyWrite', async () => {
    const formData = new FormData();
    formData.set('item_type', 'raw_material');
    formData.set('item_id', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
    formData.set('movement_type', 'entry');
    formData.set('quantity', '2.5');
    formData.set('notes', 'Ajuste manual');

    const { createInventoryAdjustment } = await import('./actions');
    await expect(createInventoryAdjustment(formData)).rejects.toThrow();

    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it('createInventoryAdjustment_keepsProductAdjustmentsWorking', async () => {
    const formData = new FormData();
    formData.set('item_type', 'product');
    formData.set('item_id', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
    formData.set('movement_type', 'entry');
    formData.set('quantity', '3');
    formData.set('notes', 'Ajuste de producto');

    const { createInventoryAdjustment } = await import('./actions');
    await createInventoryAdjustment(formData);

    expect(mocks.from).toHaveBeenCalledWith('inventory_movements');
    expect(mocks.insert).toHaveBeenCalledWith({
      item_type: 'product',
      item_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      product_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      movement_type: 'entry',
      quantity: 3,
      reference_type: 'manual_adjustment',
      reference_id: null,
      notes: 'Ajuste de producto',
    });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
