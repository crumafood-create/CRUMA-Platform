import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PublicHome } from './public-home';

describe('portada pública de Crumafood', () => {
  it('presenta la propuesta comercial y elimina el prototipo interno', () => {
    render(<PublicHome />);

    expect(screen.getByRole('heading', {
      level: 1,
      name: /tradición lista para compartir/i,
    })).toBeInTheDocument();
    expect(screen.queryByText(/centro de mando/i)).not.toBeInTheDocument();
  });

  it('ofrece recorridos claros al catálogo y al canal mayorista', () => {
    render(<PublicHome />);

    expect(screen.getByRole('link', { name: /^ver catálogo$/i }))
      .toHaveAttribute('href', '/catalogo');
    expect(screen.getByRole('link', { name: /compras para negocio/i }))
      .toHaveAttribute('href', '/catalogo#mayoreo');
  });

  it('comunica venta para hogares, negocios y eventos', () => {
    render(<PublicHome />);

    expect(screen.getByText(/hogares, negocios y eventos/i))
      .toBeInTheDocument();
  });
});
