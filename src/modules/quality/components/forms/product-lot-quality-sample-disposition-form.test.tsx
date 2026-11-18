import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { buildProductLotQualitySampleDispositionRequest } from '../../application/quality-control-contract';
import { ProductLotQualitySampleDispositionForm } from './product-lot-quality-sample-disposition-form';

describe('ProductLotQualitySampleDispositionForm', () => {
  it('cambia de retorno autorizado a merma y envía merma en el primer intento', async () => {
    const action = vi.fn(async (formData: FormData) => {
      buildProductLotQualitySampleDispositionRequest(formData);
    });
    render(
      <ProductLotQualitySampleDispositionForm
        action={action}
        inspectionId="inspection-1"
        sampleId="sample-1"
        pendingQuantity={2}
        idempotencyKey="fd000000-0000-4000-8000-000000000301"
      />,
    );

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.change(screen.getByRole('combobox', { name: 'Destino' }), {
      target: { value: 'direct_waste' },
    });
    expect(screen.queryByRole('checkbox')).toBeNull();

    fireEvent.change(screen.getByLabelText('Motivo de la decisión'), {
      target: { value: 'Muestra consumida en prueba destructiva' },
    });
    fireEvent.submit(screen.getByRole('button', {
      name: 'Registrar destino de estas piezas',
    }).closest('form')!);

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const submitted = action.mock.calls.at(0)?.[0];
    if (!submitted) throw new Error('El formulario no envió sus datos.');
    expect(submitted.get('destination')).toBe('direct_waste');
    expect(submitted.has('return_authorized')).toBe(false);
    expect(buildProductLotQualitySampleDispositionRequest(submitted)).toMatchObject({
      destination: 'direct_waste',
      returnAuthorized: false,
    });
    // A single first submission is the only command; DB idempotency protects retries.
    expect(action).toHaveBeenCalledTimes(1);
  });
});
