import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  authorize: vi.fn(),
  from: vi.fn(),
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('@/modules/identity/guards/action.guard', () => ({
  requireTypedAuthorizedAction: mocks.authorize,
}));

import { updateRawMaterial } from './actions';

describe('updateRawMaterial', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authorize.mockResolvedValue({ supabase: { from: mocks.from } });
  });

  it('preserves inventory-owned values when catalog fields change', async () => {
    const materialId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const persisted = {
      id: materialId,
      name: 'Harina de trigo',
      current_stock: 12.5,
      average_cost: 3.25,
      last_cost: 4.1,
    };
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn((changes: Record<string, unknown>) => {
      Object.assign(persisted, changes);
      return { eq };
    });
    mocks.from.mockReturnValue({ update });

    const formData = new FormData();
    formData.set('name', 'Harina integral');
    formData.set('slug', 'harina-integral');
    formData.set('category_id', '');
    formData.set('family_id', '');
    formData.set('minimum_stock', '2');
    formData.set('current_stock', '900');
    formData.set('average_cost', '901');
    formData.set('last_cost', '902');

    await updateRawMaterial(materialId, formData);

    expect(mocks.authorize).toHaveBeenCalledWith('inventory.material.manage');
    expect(mocks.from).toHaveBeenCalledWith('raw_materials');
    expect(eq).toHaveBeenCalledWith('id', materialId);
    expect(update).toHaveBeenCalledOnce();
    expect(update.mock.calls[0]?.[0]).not.toHaveProperty('current_stock');
    expect(update.mock.calls[0]?.[0]).not.toHaveProperty('average_cost');
    expect(update.mock.calls[0]?.[0]).not.toHaveProperty('last_cost');
    expect(persisted).toMatchObject({
      id: materialId,
      name: 'Harina integral',
      current_stock: 12.5,
      average_cost: 3.25,
      last_cost: 4.1,
    });
  });
});
