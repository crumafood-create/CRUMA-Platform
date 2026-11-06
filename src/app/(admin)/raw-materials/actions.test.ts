import { beforeEach, describe, expect, it, vi } from 'vitest';
import { redirect } from 'next/navigation';

const mocks = vi.hoisted(() => ({
  authorize: vi.fn(),
  insert: vi.fn(),
  from: vi.fn(),
  unitLookup: vi.fn(),
  unitFilters: [] as Array<[string, string, unknown]>,
}));
const ORDER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const DEFAULT_MATERIAL_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const UNIT_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('@/modules/identity/guards/action.guard', () => ({
  requireTypedAuthorizedAction: mocks.authorize,
}));

import { createRawMaterial, updateRawMaterial } from './actions';

describe('raw material actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.unitFilters.length = 0;
    mocks.unitLookup.mockResolvedValue({ data: { id: UNIT_ID }, error: null });
    mocks.insert.mockReturnValue({
      select: () => ({
        single: async () => ({
          data: { id: DEFAULT_MATERIAL_ID },
          error: null,
        }),
      }),
    });
    mocks.from.mockImplementation((table: string) => {
      if (table !== 'units_of_measure') return { insert: mocks.insert };

      const query: Record<string, unknown> = {
        select: () => query,
        eq: (column: string, value: unknown) => {
          mocks.unitFilters.push(['eq', column, value]);
          return query;
        },
        is: (column: string, value: unknown) => {
          mocks.unitFilters.push(['is', column, value]);
          return query;
        },
        maybeSingle: mocks.unitLookup,
      };
      return query;
    });
    mocks.authorize.mockResolvedValue({
      supabase: { from: mocks.from },
    });
  });

  it('persists zero stock and average cost regardless of submitted values', async () => {
    const formData = new FormData();
    formData.set('name', 'Harina de trigo');
    formData.set('slug', 'harina-de-trigo');
    formData.set('unit_of_measure_id', UNIT_ID);
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
    formData.set('unit_of_measure_id', UNIT_ID);

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
    formData.set('unit_of_measure_id', UNIT_ID);
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

  it.each([
    ['missing', null],
    ['nonexistent', 'ffffffff-ffff-4fff-8fff-ffffffffffff'],
    ['inactive', '11111111-1111-4111-8111-111111111111'],
    ['deleted', '22222222-2222-4222-8222-222222222222'],
  ])('rejects a %s unit before inserting a material', async (_state, unitId) => {
    const formData = new FormData();
    formData.set('name', 'Harina de trigo');
    formData.set('slug', 'harina-de-trigo');
    if (unitId) formData.set('unit_of_measure_id', unitId);
    mocks.unitLookup.mockResolvedValue({ data: null, error: null });

    await expect(createRawMaterial.bind(null, null)(formData)).rejects.toThrow();

    expect(mocks.insert).not.toHaveBeenCalled();
    if (unitId) {
      expect(mocks.unitFilters).toContainEqual(['eq', 'id', unitId]);
      expect(mocks.unitFilters).toContainEqual(['eq', 'is_active', true]);
      expect(mocks.unitFilters).toContainEqual(['is', 'deleted_at', null]);
    } else {
      expect(mocks.from).not.toHaveBeenCalledWith('units_of_measure');
    }
  });

  it.each(['inactive', 'deleted'])(
    'rejects assigning a %s unit when updating a material',
    async () => {
      const currentUnitLookup = vi.fn().mockResolvedValue({
        data: { unit_of_measure_id: UNIT_ID },
        error: null,
      });
      const currentMaterialQuery: Record<string, unknown> = {
        select: () => currentMaterialQuery,
        eq: () => currentMaterialQuery,
        maybeSingle: currentUnitLookup,
      };
      const unitQuery: Record<string, unknown> = {
        select: () => unitQuery,
        eq: (column: string, value: unknown) => {
          mocks.unitFilters.push(['eq', column, value]);
          return unitQuery;
        },
        is: (column: string, value: unknown) => {
          mocks.unitFilters.push(['is', column, value]);
          return unitQuery;
        },
        maybeSingle: mocks.unitLookup,
      };
      const update = vi.fn();
      mocks.from.mockImplementation((table: string) =>
        table === 'raw_materials'
          ? { select: () => currentMaterialQuery, update }
          : unitQuery,
      );
      mocks.unitLookup.mockResolvedValue({ data: null, error: null });
      const formData = new FormData();
      formData.set('name', 'Harina integral');
      formData.set('slug', 'harina-integral');
      formData.set('unit_of_measure_id', 'ffffffff-ffff-4fff-8fff-ffffffffffff');

      await expect(updateRawMaterial('dddddddd-dddd-4ddd-8ddd-dddddddddddd', formData))
        .rejects.toThrow('La unidad base seleccionada no está disponible.');

      expect(currentUnitLookup).toHaveBeenCalledOnce();
      expect(mocks.unitFilters).toContainEqual(['eq', 'is_active', true]);
      expect(mocks.unitFilters).toContainEqual(['is', 'deleted_at', null]);
      expect(update).not.toHaveBeenCalled();
    },
  );

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

  it('allows catalog edits for a legacy material with no unit', async () => {
    const materialId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValue({ update });
    const formData = new FormData();
    formData.set('name', 'Harina integral');
    formData.set('slug', 'harina-integral');
    formData.set('internal_code', 'MP-HARINA');
    formData.set('category_id', '');
    formData.set('family_id', '');
    formData.set('minimum_stock', '2');
    formData.set('description', 'Ingrediente base');
    formData.set('is_active', 'true');
    formData.set('unit_of_measure_id', '');

    await updateRawMaterial(materialId, formData);

    expect(update).toHaveBeenCalledOnce();
    expect(update.mock.calls[0]?.[0]).toHaveProperty('name', 'Harina integral');
    expect(update.mock.calls[0]?.[0]).toHaveProperty('unit_of_measure_id', null);
    expect(mocks.unitLookup).not.toHaveBeenCalled();
  });
});
