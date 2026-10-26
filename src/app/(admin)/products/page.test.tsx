import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import ProductsPage from './page';

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock('@/infrastructure/integrations/supabase/server', () => ({ createTypedClient: createClient }));
vi.mock('@/modules/identity/guards/auth.guard', () => ({
  requireAuthenticatedUser: async () => ({ actor: {
    userId: 'admin-1', roles: ['admin'], authorizationSource: 'legacy_user_roles',
  } }),
}));

it('consulta y muestra el stock mínimo de los productos, incluido cero', async () => {
  const products = [
    { id: 'product-1', name: 'Pan integral', slug: 'pan-integral', status: 'archived', min_stock: 12 },
    { id: 'product-2', name: 'Pan blanco', slug: 'pan-blanco', status: 'active', min_stock: 0 },
  ];
  const productSelect = vi.fn();
  createClient.mockResolvedValue({ from(table: string) {
    const query = {
      select: (columns: string) => {
        if (table === 'products') productSelect(columns);
        return query;
      },
      is: () => query,
      order: async () => ({ data: table === 'products' ? products : [], error: null }),
    };
    return query;
  } });

  render(await ProductsPage());

  expect(screen.getByText('Pan integral')).toBeInTheDocument();
  expect(screen.getByText('Stock mínimo: 12')).toBeInTheDocument();
  expect(screen.getByText('Stock mínimo: 0')).toBeInTheDocument();
  expect(productSelect).toHaveBeenCalledExactlyOnceWith(expect.stringMatching(/(?:^|,\s*)min_stock(?:,|$)/));
});
