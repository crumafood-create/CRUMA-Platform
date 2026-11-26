import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  authorize: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('@/modules/identity/guards/action.guard', () => ({
  requireTypedAuthorizedAction: mocks.authorize,
}));

import { transferRawMaterialLotLocation } from './actions';

describe('transferRawMaterialLotLocation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rpc.mockResolvedValue({ data: 'movement-id', error: null });
    mocks.authorize.mockResolvedValue({ supabase: { rpc: mocks.rpc } });
  });

  it('calls the authorized inventory RPC with lot, destination, reason and idempotency key', async () => {
    const formData = new FormData();
    formData.set('lot_id', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
    formData.set('destination_location_id', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
    formData.set('reason', '  Refrigerador de semielaborados  ');
    formData.set('idempotency_key', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc');

    await transferRawMaterialLotLocation(formData);

    expect(mocks.authorize).toHaveBeenCalledWith('inventory.adjustment.create');
    expect(mocks.rpc).toHaveBeenCalledWith('transfer_raw_material_lot_location', {
      p_lot_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      p_destination_location_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      p_reason: 'Refrigerador de semielaborados',
      p_idempotency_key: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    });
  });

  it('rejects incomplete transfer data before calling the database', async () => {
    const formData = new FormData();
    formData.set('lot_id', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

    await expect(transferRawMaterialLotLocation(formData)).rejects.toThrow('obligatorios');

    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('surfaces the database compatibility rejection without redirecting as success', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: 'Source and destination are incompatible.' } });
    const formData = new FormData();
    formData.set('lot_id', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
    formData.set('destination_location_id', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
    formData.set('reason', 'Prueba incompatible');
    formData.set('idempotency_key', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc');

    await expect(transferRawMaterialLotLocation(formData)).rejects.toThrow('incompatible');
  });
});
