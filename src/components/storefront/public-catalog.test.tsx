import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PublicCatalog } from './public-catalog';

describe('catálogo público de Crumafood', () => {
  it('expone todas las líneas autorizadas como encabezados navegables', () => {
    render(<PublicCatalog />);

    for (const name of ['Tequeños', 'Empanadas', 'Discos', 'Masas']) {
      expect(screen.getByRole('heading', { name })).toBeInTheDocument();
    }
  });

  it('separa la compra personal de la atención a negocios', () => {
    render(<PublicCatalog />);

    expect(screen.getByRole('heading', { name: /¿compras para tu negocio/i }))
      .toBeInTheDocument();
    expect(screen.getByText(/mayoreo, food service y eventos/i))
      .toBeInTheDocument();
  });

  it('no habilita un checkout ficticio en esta etapa', () => {
    render(<PublicCatalog />);

    expect(screen.queryByRole('button', { name: /comprar|pagar/i }))
      .not.toBeInTheDocument();
  });
});
