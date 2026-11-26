import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import RawMaterialsPage from './page';

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock('@/infrastructure/integrations/supabase/server', () => ({
  createTypedClient: createClient,
}));

it('ofrece acceso a compras desde el catálogo de materias primas', async () => {
  createClient.mockResolvedValue({
    from: (table: string) => {
      const query = {
        select: () => query,
        is: () => query,
        gt: async () => ({ data: [], error: null }),
        order: async () => ({ data: table === 'raw_materials' ? [] : [], error: null }),
        eq: async () => ({ data: [], error: null }),
      };

      return query;
    },
  });

  render(await RawMaterialsPage({}));

  expect(screen.getByRole('link', { name: 'Crear orden de compra' })).toHaveAttribute(
    'href',
    '/purchase-orders/new',
  );
});

it('rawMaterialCatalog_confirmsSuccessfulCreation', async () => {
  createClient.mockResolvedValue({
    from: () => {
      const query = {
        select: () => query,
        is: () => query,
        gt: async () => ({ data: [], error: null }),
        order: async () => ({ data: [], error: null }),
        eq: async () => ({ data: [], error: null }),
      };

      return query;
    },
  });

  render(await RawMaterialsPage({
    searchParams: Promise.resolve({ created: '1' }),
  }));

  expect(screen.getByRole('status')).toHaveTextContent(
    'Materia prima creada correctamente.',
  );
});

it('muestra en solo lectura los códigos de ubicación con saldo en cada material', async () => {
  createClient.mockResolvedValue({
    from: (table: string) => {
      const query = {
        select: () => query,
        is: () => query,
        order: async () => ({
          data: table === 'raw_materials' ? [{
            id: 'material-1',
            name: 'Queso rallado',
            internal_code: 'MP-QSO-RALLADO',
            current_stock: 0.48,
            average_cost: 80,
            unit_of_measure_id: 'unit-kg',
            is_active: true,
          }] : [],
          error: null,
        }),
        eq: async () => ({
          data: table === 'units_of_measure' ? [{ id: 'unit-kg', code: 'kg', name: 'Kilogramos' }] : [],
          error: null,
        }),
        gt: async () => ({
          data: table === 'raw_material_lots' ? [
            { raw_material_id: 'material-1', quantity: 0.2, inventory_locations: { slug: 'REF-SEMI-01' } },
            { raw_material_id: 'material-1', quantity: 0.28, inventory_locations: { slug: 'REF-SEMI-02' } },
          ] : [],
          error: null,
        }),
      };
      return query;
    },
  });

  render(await RawMaterialsPage({}));

  expect(screen.getByRole('textbox', { name: 'Ubicaciones de Queso rallado' }))
    .toHaveValue('REF-SEMI-01, REF-SEMI-02');
  expect(screen.getByRole('textbox', { name: 'Ubicaciones de Queso rallado' }))
    .toHaveAttribute('readonly');
});
