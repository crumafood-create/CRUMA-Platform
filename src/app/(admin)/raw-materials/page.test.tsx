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
        order: async () => ({ data: table === 'raw_materials' ? [] : [], error: null }),
        eq: async () => ({ data: [], error: null }),
      };

      return query;
    },
  });

  render(await RawMaterialsPage());

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
