import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import ProductionLotsPage from './page';

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock('@/infrastructure/integrations/supabase/server', () => ({
  createTypedClient: createClient,
}));

it('muestra kilogramos para masa intermedia y piezas para producto terminado', async () => {
  createClient.mockResolvedValue({
    from: () => ({
      select: () => ({
        order: async () => ({
          data: [
            {
              id: 'mass-lot',
              lot_number: 'MP08-MASA-SEMI-215-20261126-A',
              initial_quantity: 2.15,
              quantity: 2.15,
              status: 'available',
              expiration_date: '2026-12-03',
              production_order_id: 'mass-order',
              products: { name: 'Masa estándar' },
              warehouses: { name: 'Producción' },
              inventory_locations: { name: 'Refrigeración de semielaborados' },
              production_outputs: { mass_quantity_produced: 2.15 },
            },
            {
              id: 'finished-lot',
              lot_number: 'MP08-TEQ-PARTY-6-20261126-A',
              initial_quantity: 6,
              quantity: 6,
              status: 'available',
              expiration_date: '2026-12-03',
              production_order_id: 'finished-order',
              products: { name: 'Tequeños Party Queso' },
              warehouses: { name: 'Producción' },
              inventory_locations: { name: 'Congelador de producto terminado' },
              production_outputs: { mass_quantity_produced: null },
            },
          ],
          error: null,
        }),
      }),
    }),
  });

  render(await ProductionLotsPage());

  expect(screen.getByText('2.15 de 2.15 kg')).toBeInTheDocument();
  expect(screen.getByText('6 de 6 unidades')).toBeInTheDocument();
});
