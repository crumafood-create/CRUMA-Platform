import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import InventoryAdjustmentsPage from './page';

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock('@/infrastructure/integrations/supabase/server', () => ({
  createTypedClient: createClient,
}));

describe('InventoryAdjustmentsPage', () => {
  it('offers separate access to product and raw material lot adjustments', async () => {
    const query = {
      select: () => query,
      eq: () => query,
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    createClient.mockResolvedValue({ from: vi.fn(() => query) });

    render(await InventoryAdjustmentsPage());

    expect(screen.getByRole('link', { name: 'Ajustar producto' })).toHaveAttribute(
      'href',
      '/inventory/adjustments/new',
    );
    expect(screen.getByRole('link', { name: 'Ajustar materia prima por lote' })).toHaveAttribute(
      'href',
      '/inventory/adjustments/raw-material-lots/new',
    );
  });
});
