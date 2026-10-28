import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import NewInventoryAdjustmentPage from './page';

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock('@/infrastructure/integrations/supabase/server', () => ({
  createTypedClient: createClient,
}));
vi.mock('../actions', () => ({
  createInventoryAdjustment: vi.fn(),
}));

describe('NewInventoryAdjustmentPage', () => {
  it('generic product adjustment does not load or offer raw materials', async () => {
    const queriedTables: string[] = [];
    const products = [{ id: 'product-1', name: 'Tequeños', internal_code: 'TEQ-01' }];
    createClient.mockResolvedValue({
      from: (table: string) => {
        queriedTables.push(table);
        const query = {
          select: () => query,
          eq: () => query,
          is: () => query,
          order: async () => ({ data: table === 'products' ? products : [], error: null }),
        };
        return query;
      },
    });

    const { container } = render(await NewInventoryAdjustmentPage());
    const itemSelector = container.querySelector<HTMLSelectElement>('select[name="item_id"]')!;

    expect(queriedTables).toEqual(['products']);
    expect(screen.getByRole('option', { name: 'TEQ-01 - Tequeños' })).toBeInTheDocument();
    expect(screen.queryByText('Materia Prima')).not.toBeInTheDocument();
    expect(container.querySelector('input[name="item_type"]')).toHaveValue('product');
  });
});
