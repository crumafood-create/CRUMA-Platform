import { render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';

import PurchaseOrderItemsPage from './page';

const ORDER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const MATERIAL_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const PREVIOUS_MATERIAL_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const USER_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock('@/infrastructure/integrations/supabase/server', () => ({
  createTypedClient: createClient,
}));

beforeEach(() => {
  sessionStorage.clear();
});

it('purchaseOrderItems_offersMissingMaterialCreationWithOrderContext', async () => {
  createClient.mockResolvedValue({
    auth: { getUser: async () => ({ data: { user: { id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' } } }) },
    from: (table: string) => {
      const query = {
        select: () => query,
        eq: () => table === 'purchase_order_items'
          ? Promise.resolve({ data: [], error: null })
          : query,
        is: () => query,
        order: async () => ({ data: [], error: null }),
        maybeSingle: async () => ({
          data: table === 'purchase_orders'
            ? { id: ORDER_ID, status: 'draft' }
            : null,
          error: null,
        }),
      };

      return query;
    },
  });

  render(await PurchaseOrderItemsPage({
    params: Promise.resolve({ id: ORDER_ID }),
  }));

  expect(screen.getByRole('link', { name: 'Crear materia prima' })).toHaveAttribute(
    'href',
    `/raw-materials/new?returnToPurchaseOrderId=${ORDER_ID}`,
  );
});

it('purchaseOrderItems_preselectsCreatedMaterialAndRestoresCaptureWithoutAddingLine', async () => {
  sessionStorage.setItem(
    `cruma:purchase-order-item:${USER_ID}:${ORDER_ID}`,
    JSON.stringify({
      raw_material_id: PREVIOUS_MATERIAL_ID,
      quantity: '8.25',
      unit_cost: '17.40',
    }),
  );

  createClient.mockResolvedValue({
    auth: { getUser: async () => ({ data: { user: { id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' } } }) },
    from: (table: string) => {
      const query = {
        select: () => query,
        eq: () => table === 'purchase_order_items'
          ? Promise.resolve({ data: [], error: null })
          : query,
        is: () => query,
        order: async () => ({
          data: table === 'raw_materials'
            ? [{ id: MATERIAL_ID, name: 'Harina nueva', internal_code: null }]
            : [],
          error: null,
        }),
        maybeSingle: async () => ({
          data: table === 'purchase_orders'
            ? { id: ORDER_ID, status: 'draft' }
            : null,
          error: null,
        }),
      };

      return query;
    },
  });

  const { container } = render(await PurchaseOrderItemsPage({
    params: Promise.resolve({ id: ORDER_ID }),
    searchParams: Promise.resolve({ rawMaterialId: MATERIAL_ID }),
  }));

  expect(container.querySelector('select[name="raw_material_id"]')).toHaveValue(
    MATERIAL_ID,
  );
  expect(screen.getByText('No hay artículos.')).toBeInTheDocument();
  expect(container.querySelector('input[name="quantity"]')).toHaveValue('8.25');
  expect(container.querySelector('input[name="unit_cost"]')).toHaveValue('17.40');
  expect(screen.getByRole('button', { name: 'Agregar' })).toBeInTheDocument();
});
