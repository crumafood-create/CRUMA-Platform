import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ authorize: vi.fn(), rpc: vi.fn() }));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/modules/identity/guards/action.guard', () => ({
  requireTypedAuthorizedAction: mocks.authorize,
}));

import { resolveProductLotFreezing } from './storage-actions';

describe('resolveProductLotFreezing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rpc.mockResolvedValue({ data: 'movement-id', error: null });
    mocks.authorize.mockResolvedValue({ supabase: { rpc: mocks.rpc } });
  });

  it('sends only the quantity, destination and reason belonging to the selected operation', async () => {
    const formData = new FormData();
    formData.set('operation_id', 'operation-small');
    formData.set('idempotency_key', 'request-small');
    formData.set('quantity_operation-small', '1');
    formData.set('destination_operation-small', 'raw_frozen');
    formData.set('reason_operation-small', 'Resolver incidencia pequeña');
    formData.set('quantity_operation-large', '6');
    formData.set('destination_operation-large', 'waste');
    formData.set('reason_operation-large', 'Resolver incidencia grande');

    await resolveProductLotFreezing(formData);

    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith('resolve_product_lot_freezing', {
      p_operation_id: 'operation-small',
      p_quantity: 1,
      p_destination: 'raw_frozen',
      p_conservation_verified: false,
      p_reason: 'Resolver incidencia pequeña',
      p_idempotency_key: 'request-small',
    });
  });
});
