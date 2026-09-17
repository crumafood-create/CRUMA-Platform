import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StorefrontProductGrid } from './storefront-product-grid';

const product = {
  product_id: 'product-1',
  slug: 'tequenos-queso',
  name: 'Tequeños de queso',
  short_description: 'Crujientes por fuera.',
  description: null,
  category_slug: 'tequenos',
  category_name: 'Tequeños',
  presentation: 'Caja con 12 piezas',
  price: 149.9,
  currency: 'MXN',
  image_url: null,
  image_alt: 'Tequeños de queso',
  seo_title: null,
  seo_description: null,
  is_featured: true,
  is_published: true,
  published_at: '2026-09-17T12:00:00.000Z',
  created_at: '2026-09-17T12:00:00.000Z',
  updated_at: '2026-09-17T12:00:00.000Z',
};

describe('rejilla dinámica del catálogo', () => {
  it('muestra ficha, presentación, precio B2C y enlace estable', () => {
    render(<StorefrontProductGrid products={[product]} />);

    expect(screen.getByRole('heading', { name: 'Tequeños de queso' })).toBeInTheDocument();
    expect(screen.getByText('Caja con 12 piezas')).toBeInTheDocument();
    expect(screen.getByText('$149.90')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ver tequeños de queso/i }))
      .toHaveAttribute('href', '/producto/tequenos-queso');
  });

  it('no inventa disponibilidad ni acciones de compra', () => {
    render(<StorefrontProductGrid products={[product]} />);
    expect(screen.queryByText(/en stock|disponible ahora/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /comprar|agregar/i })).not.toBeInTheDocument();
  });

  it('explica el estado vacío sin filtrar errores técnicos', () => {
    render(<StorefrontProductGrid products={[]} />);
    expect(screen.getByText(/estamos preparando el catálogo/i)).toBeInTheDocument();
  });
});
