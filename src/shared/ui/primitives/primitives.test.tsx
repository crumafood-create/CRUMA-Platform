import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from './button';
import { Card, CardContent, CardHeader } from './card';

describe('primitivas canónicas', () => {
  it('aplica variante, tamaño y comportamiento seguro por defecto', () => {
    render(<Button>Guardar</Button>);

    const button = screen.getByRole('button', { name: 'Guardar' });

    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass('bg-brand-blue');
    expect(button).toHaveClass('min-h-11');
    expect(button).toHaveClass('focus-visible:ring-2');
  });

  it('permite ancho completo sin perder clases del consumidor', () => {
    render(
      <Button fullWidth className="test-hook">
        Continuar
      </Button>,
    );

    expect(screen.getByRole('button', { name: 'Continuar' })).toHaveClass(
      'w-full',
      'test-hook',
    );
  });

  it('compone Card con superficie y regiones consistentes', () => {
    render(
      <Card data-testid="card">
        <CardHeader>Encabezado</CardHeader>
        <CardContent>Contenido</CardContent>
      </Card>,
    );

    expect(screen.getByTestId('card')).toHaveClass(
      'rounded-2xl',
      'border',
      'bg-white',
    );
    expect(screen.getByText('Encabezado')).toHaveClass('border-b');
  });
});