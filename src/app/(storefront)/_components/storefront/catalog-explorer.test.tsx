import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { StorefrontProduct } from '@/modules/storefront/application/storefront-product-repository';

import { CatalogExplorer, filterStorefrontProducts } from './catalog-explorer';

const product = (overrides: Partial<StorefrontProduct>): StorefrontProduct => ({
  product_id: 'product-1',
  slug: 'tequenos-clasicos',
  name: 'Tequeños clásicos',
  short_description: 'Crujientes y listos para compartir.',
  description: null,
  category_slug: 'tequenos',
  category_name: 'Tequeños',
  presentation: 'Paquete de 12',
  price: 120,
  currency: 'MXN',
  image_url: null,
  image_alt: 'Tequeños clásicos',
  seo_title: null,
  seo_description: null,
  is_featured: true,
  is_published: true,
  published_at: '2026-09-19T00:00:00Z',
  created_at: '2026-09-19T00:00:00Z',
  updated_at: '2026-09-19T00:00:00Z',
  ...overrides,
});

describe('explorador del catálogo', () => {
  const products = [
    product({}),
    product({ product_id: 'product-2', slug: 'empanada-carne', name: 'Empanada de carne', category_slug: 'empanadas', category_name: 'Empanadas' }),
  ];

  it('filtra por texto y anuncia la cantidad de resultados', () => {
    render(<CatalogExplorer products={products} />);
    fireEvent.change(screen.getByRole('searchbox', { name: /buscar productos/i }), {
      target: { value: 'empanada' },
    });

    expect(screen.getByRole('status')).toHaveTextContent('1 producto');
    expect(screen.getByRole('heading', { name: 'Empanada de carne' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Tequeños clásicos' })).not.toBeInTheDocument();
  });

  it('ofrece filtros de categoría con estado accesible', () => {
    render(<CatalogExplorer products={products} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tequeños' }));

    expect(screen.getByRole('button', { name: 'Tequeños' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('normaliza acentos sin mutar el arreglo original', () => {
    const products = [product({ name: 'Tequeños clásicos' })];
    expect(filterStorefrontProducts(products, 'tequenos', 'all')).toEqual(products);
    expect(products[0]?.name).toBe('Tequeños clásicos');
  });
});
