import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock('../storage-actions', () => ({
  decideProductLotRefrigeratedWait: vi.fn(),
  resolveProductLotFreezing: vi.fn(),
  startProductLotFreezing: vi.fn(),
}));

import StorageConditionsClient, { type PendingFreezing } from './storage-conditions-client';

const incidents: PendingFreezing[] = [
  {
    operation_id: 'operation-small',
    product_lot_id: 'lot-shared',
    lot_number: 'LOT-SHARED',
    product_name: 'Tequeños Party',
    requested_quantity: 3,
    pending_quantity: 1,
    reason: 'Incidencia pequeña',
    started_at: '2026-11-24T10:00:00.000Z',
    started_from: 'fresh',
  },
  {
    operation_id: 'operation-large',
    product_lot_id: 'lot-shared',
    lot_number: 'LOT-SHARED',
    product_name: 'Tequeños Party',
    requested_quantity: 8,
    pending_quantity: 6,
    reason: 'Incidencia grande',
    started_at: '2026-11-24T11:00:00.000Z',
    started_from: 'fresh',
  },
];

describe('tarjetas de decisiones de congelación', () => {
  it('mantiene aislados el identificador, cantidad y motivo de cada incidencia del mismo lote', () => {
    render(<StorageConditionsClient lots={[]} pending={incidents} freezerLocations={[]} />);

    const smallCard = document.querySelector<HTMLElement>(
      '[data-freezing-operation-card="operation-small"]',
    );
    const largeCard = document.querySelector<HTMLElement>(
      '[data-freezing-operation-card="operation-large"]',
    );
    expect(smallCard).not.toBeNull();
    expect(largeCard).not.toBeNull();
    expect(smallCard).toHaveTextContent('Motivo inicial: Incidencia pequeña');
    expect(largeCard).toHaveTextContent('Motivo inicial: Incidencia grande');

    const smallForm = smallCard!.querySelector('form')!;
    const largeForm = largeCard!.querySelector('form')!;
    expect(smallForm.dataset.freezingOperationId).toBe('operation-small');
    expect(largeForm.dataset.freezingOperationId).toBe('operation-large');
    expect((smallForm.elements.namedItem('operation_id') as HTMLInputElement).value).toBe('operation-small');
    expect((largeForm.elements.namedItem('operation_id') as HTMLInputElement).value).toBe('operation-large');
    expect(smallForm.getAttribute('autocomplete')).toBe('off');
    expect(largeForm.getAttribute('autocomplete')).toBe('off');

    const smallQuantity = smallForm.querySelector<HTMLInputElement>('input[name="quantity_operation-small"]')!;
    const largeQuantity = largeForm.querySelector<HTMLInputElement>('input[name="quantity_operation-large"]')!;
    const smallReason = smallForm.querySelector<HTMLInputElement>('input[name="reason_operation-small"]')!;
    const largeReason = largeForm.querySelector<HTMLInputElement>('input[name="reason_operation-large"]')!;
    expect(smallQuantity.max).toBe('1');
    expect(largeQuantity.max).toBe('6');

    fireEvent.change(smallQuantity, { target: { value: '1' } });
    fireEvent.change(smallReason, { target: { value: 'Resolver incidencia pequeña' } });

    expect(largeQuantity.value).toBe('');
    expect(largeReason.value).toBe('');

    fireEvent.change(largeQuantity, { target: { value: '6' } });
    fireEvent.change(largeReason, { target: { value: 'Resolver incidencia grande' } });
    expect(smallQuantity.value).toBe('1');
    expect(smallReason.value).toBe('Resolver incidencia pequeña');
  });
});
