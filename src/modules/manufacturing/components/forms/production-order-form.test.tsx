import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ProductionOrderForm } from './production-order-form';

const ERROR_MESSAGE =
  'No hay masa liberada suficiente para iniciar la orden.';

describe('ProductionOrderForm', () => {
  it('muestra errores de validación devueltos por la acción', async () => {
    const action = vi.fn().mockResolvedValue({ error: ERROR_MESSAGE });
    const { container } = render(
      <ProductionOrderForm
        action={action}
        idempotencyKey="test-idempotency-key"
        recipes={[{ id: 'recipe-id', name: 'Tequeños Party Queso' }]}
      />,
    );

    fireEvent.submit(container.querySelector('form')!);

    expect(await screen.findByRole('alert')).toHaveTextContent(ERROR_MESSAGE);
    expect(action).toHaveBeenCalledTimes(1);
  });
});
