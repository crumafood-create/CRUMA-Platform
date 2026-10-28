import { beforeEach, describe, expect, it, vi } from 'vitest';
import { redirect } from 'next/navigation';

const mocks = vi.hoisted(() => ({
  authorize: vi.fn(),
  insert: vi.fn(),
  from: vi.fn(),
}));
const ORDER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const DEFAULT_MATERIAL_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('@/modules/identity/guards/action.guard', () => ({
  requireTypedAuthorizedAction: mocks.authorize,
}));

import { createRawMaterial, updateRawMaterial } from './actions';

describe('raw material actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.insert.mockReturnValue({
      select: () => ({
        single: async () => ({
          data: { id: DEFAULT_MATERIAL_ID },
          error: null,
        }),
      }),
    });
    mocks.from.mockReturnValue({ insert: mocks.insert });
    mocks.authorize.mockResolvedValue({
      supabase: { from: mocks.from },
    });
  });

  it('persists zero stock and average cost regardless of submitted values', async () => {
    const formData = new FormData();
    formData.set('name', 'Harina de trigo');
    formData.set('slug', 'harina-de-trigo');
    formData.set('current_stock', '42');
    formData.set('average_cost', '123.45');

    await createRawMaterial.bind(null, null)(formData);

    expect(mocks.from).toHaveBeenCalledWith('raw_materials');
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({
      current_stock: 0,
      average_cost: 0,
    }));
  });

  it('returns to the same purchase order after creating a material', async () => {
    const formData = new FormData();
    formData.set('name', 'Harina de trigo');
    formData.set('slug', 'harina-de-trigo');

    await createRawMaterial.bind(null, ORDER_ID)(formData);

    expect(redirect).toHaveBeenCalledWith(
      `/purchase-orders/${ORDER_ID}/items?rawMaterialId=${DEFAULT_MATERIAL_ID}`,
    );
  });

  it('returns with the newly created material selected', async () => {
    const materialId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const formData = new FormData();
    formData.set('name', 'Harina de trigo');
    formData.set('slug', 'harina-de-trigo');
    mocks.insert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: materialId },
          error: null,
        }),
      }),
    });

    await createRawMaterial.bind(null, ORDER_ID)(formData);

    expect(redirect).toHaveBeenCalledWith(
      `/purchase-orders/${ORDER_ID}/items?rawMaterialId=${materialId}`,
    );
  });

  it('preserves existing inventory-owned values when catalog fields change', async () => {
    const materialId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
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
