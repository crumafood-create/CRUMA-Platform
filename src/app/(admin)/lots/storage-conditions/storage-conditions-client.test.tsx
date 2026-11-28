import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock('../storage-actions', () => ({
  decideProductLotRefrigeratedWait: vi.fn(),
  resolveProductLotFreezing: vi.fn(),
  startProductLotFreezing: vi.fn(),
}));
vi.mock('../../qa/actions', () => ({ decideUnderThresholdFrozenLotQuality: vi.fn() }));

import StorageConditionsClient, { type PendingFreezing } from './storage-conditions-client';

const underThresholdLot = {
  product_lot_id: 'lot-under-threshold',
  lot_number: 'LOT-2-PLUS-3',
  expiration_date: '2090-01-01',
  location_name: 'Congelador de producto terminado',
  lot_quantity: 2,
  fresh_quantity: 0,
  raw_frozen_quantity: 2,
  freezing_quantity: 0,
  refrigerated_wait_quantity: 0,
  quality_waste_quantity: 0,
  refrigerated_wait_location_name: null,
  freezing_location_name: null,
  frozen_location_name: 'Congelador de producto terminado',
  quality_sampling_pending_quantity: 3,
  quality_sampling_reserved_quantity: 0,
  quality_rejected_pending_quantity: 0,
  cumulative_frozen_quantity: 5,
  sampling_plan_remaining_quantity: 2,
  quality_decision_history: [{
    id: 'quality-exception-2',
    inspected_quantity: 2,
    accepted_quantity: 2,
    rejected_quantity: 0,
    destructive_quantity: 0,
    witness_sample_status: 'sin muestra testigo por excepción autorizada',
    witness_sample_exception_reason: 'Excepción anterior autorizada por Calidad',
    conservation_evidence: 'folio=QA-123; fecha/hora=27/11 10:15; lectura=4 C; especificacion=2-5 C',
    reason: 'Inspección no destructiva conforme',
    decided_by: 'Responsable de Calidad',
    decided_at: '2026-11-27T10:00:00.000Z',
  }],
  product_name: 'Tequeños Party Queso Crudos',
};

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
  it('muestra el acumulado, el faltante y la excepción anterior tras liberar dos y recibir tres', () => {
    render(<StorageConditionsClient lots={[underThresholdLot]} pending={[]} freezerLocations={[]} />);

    const card = document.querySelector<HTMLElement>('[data-quality-lot="lot-under-threshold"]');
    expect(card).not.toBeNull();
    expect(card).toHaveTextContent('Congeladas acumuladas en el lote 5');
    expect(card).toHaveTextContent('Plan estándar 2+3: faltan 2');
    expect(card).toHaveTextContent('Responsable de Calidad');
    expect(card).toHaveTextContent('Excepción anterior autorizada por Calidad');
    expect(card).toHaveTextContent('Evidencia de conservación: folio=QA-123');
    expect(card).toHaveTextContent('La ausencia de registros no confirma conservación');
    expect(card!.querySelector<HTMLInputElement>('input[name="inspected_quantity"]')?.value).toBe('3');
    expect(card!.querySelector<HTMLInputElement>('input[name="accepted_quantity"]')).not.toBeNull();
  });

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
