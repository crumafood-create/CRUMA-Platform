import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import NewRawMaterialLotAdjustmentPage from './page';

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock('@/infrastructure/integrations/supabase/server', () => ({
  createTypedClient: createClient,
}));

describe('NewRawMaterialLotAdjustmentPage', () => {
  it('carga y presenta lotes disponibles con materia prima, cantidad y ubicación', async () => {
    const availableLot = {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      lot_number: 'LOT-17',
      quantity: 6,
      raw_materials: { name: 'Harina de trigo', units_of_measure: { name: 'Kilogramos', code: 'kg' } },
      inventory_locations: { name: 'Almacén A / Estante 2' },
    };
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      order: vi.fn().mockResolvedValue({ data: [availableLot], error: null }),
    };
    createClient.mockResolvedValue({ from: vi.fn(() => query) });

    render(await NewRawMaterialLotAdjustmentPage());

    expect(query.eq).toHaveBeenCalledWith('status', 'available');
    expect(screen.getByRole('option', {
      name: 'Harina de trigo · Lote LOT-17 · Almacén A / Estante 2 · 6 kg',
    })).toBeInTheDocument();
  });
});
