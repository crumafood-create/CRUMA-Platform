import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import PurchaseOrderPage from './page';

const ORDER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock('@/infrastructure/integrations/supabase/server', () => ({
  createTypedClient: createClient,
}));

it('purchaseOrderDetails_allowsChangingSupplierAndFreightOnlyForDrafts', async () => {
  const order = {
    id: ORDER_ID,
    order_number: 'PO-1',
    supplier_id: 'supplier-1',
    order_date: '2026-11-09',
    expected_date: null,
    status: 'draft',
    subtotal: 100,
    freight_amount: 12.5,
    total: 112.5,
    notes: null,
  };
  createClient.mockResolvedValue({
    from: (table: string) => {
      const query = {
        select: () => query,
        eq: () => query,
        is: () => query,
        maybeSingle: async () => ({
          data: table === 'purchase_orders' ? order : { name: 'Proveedor de prueba' },
          error: null,
        }),
        then: (resolve: (value: unknown) => unknown) => Promise.resolve({
          data: [
            { id: 'supplier-1', name: 'Proveedor de prueba' },
            { id: 'supplier-2', name: 'Proveedor alterno' },
          ],
          error: null,
        }).then(resolve),
      };
      return query;
    },
  });

  render(await PurchaseOrderPage({ params: Promise.resolve({ id: ORDER_ID }) }));

  expect(screen.getByText('Productos')).toBeInTheDocument();
  expect(screen.getByText('$100.0000 MXN')).toBeInTheDocument();
  expect(screen.getByLabelText('Flete (MXN; puede ser cero)')).toHaveValue(12.5);
  expect(screen.getByRole('button', { name: 'Guardar flete' })).toBeInTheDocument();
  expect(screen.getByLabelText('Proveedor')).toHaveValue('supplier-1');
  expect(screen.getByRole('option', { name: 'Proveedor alterno' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Guardar proveedor' })).toBeInTheDocument();
});

it('purchaseOrderDetails_doesNotAllowChangingSupplierOutsideDraft', async () => {
  createClient.mockResolvedValue({
    from: (table: string) => {
      const query = {
        select: () => query,
        eq: () => query,
        is: () => query,
        maybeSingle: async () => ({
          data: table === 'purchase_orders'
            ? {
              id: ORDER_ID,
              order_number: 'PO-1',
              supplier_id: 'supplier-1',
              order_date: '2026-11-09',
              expected_date: null,
              status: 'released',
              subtotal: 100,
              freight_amount: 12.5,
              total: 112.5,
              notes: null,
            }
            : { name: 'Proveedor de prueba' },
          error: null,
        }),
        then: (resolve: (value: unknown) => unknown) => Promise.resolve({
          data: [{ id: 'supplier-2', name: 'Proveedor alterno' }],
          error: null,
        }).then(resolve),
      };
      return query;
    },
  });

  render(await PurchaseOrderPage({ params: Promise.resolve({ id: ORDER_ID }) }));

  expect(screen.getByText('Proveedor de prueba')).toBeInTheDocument();
  expect(screen.queryByLabelText('Proveedor')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Guardar proveedor' })).not.toBeInTheDocument();
});
