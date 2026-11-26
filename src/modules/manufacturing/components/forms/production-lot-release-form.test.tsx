import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/app/(admin)/lots/actions', () => ({
  releaseFinishedProductQualityToInventory: vi.fn(),
}));

import { ProductionLotReleaseForm } from './production-lot-release-form';
import { releaseFinishedProductQualityToInventory } from '@/app/(admin)/lots/actions';

const inspections = [
  {
    id: 'finished-inspection',
    label: 'OP-FG-001 · Tequeños Party Queso',
    quantity: 6,
    isIntermediateMass: false,
  },
  {
    id: 'mass-inspection',
    label: 'OP-MASS-001 · Masa estándar',
    quantity: 2.15,
    isIntermediateMass: true,
  },
];

const locations = [
  {
    id: 'finished-wait',
    name: 'Producto terminado refrigerado — espera de congelación',
    label: 'Producto terminado refrigerado — espera de congelación',
    locationUse: 'finished_product',
    storageCondition: 'refrigerated',
  },
  {
    id: 'finished-freezer',
    name: 'Congelador de producto terminado',
    label: 'Congelador de producto terminado',
    locationUse: 'finished_product',
    storageCondition: 'frozen',
  },
  {
    id: 'semi-refrigerator',
    name: 'Refrigeración de semielaborados',
    label: 'Refrigeración de semielaborados',
    locationUse: 'prepared_ingredient',
    storageCondition: 'refrigerated',
  },
];

describe('ProductionLotReleaseForm', () => {
  it('adapta cantidad y destinos a la salida seleccionada, conservando 2.15 kg de masa', async () => {
    render(
      <ProductionLotReleaseForm
        inspections={inspections}
        warehouses={[{ id: 'warehouse', label: 'Producción' }]}
        locations={locations}
        initialInspectionId="finished-inspection"
        idempotencyKey="idempotency-key"
      />,
    );

    const inspectionSelect = screen.getByLabelText('Inspección aprobada');
    const locationSelect = screen.getByLabelText('Destino inicial del lote');

    expect(screen.getByRole('option', { name: /6 unidades/ })).toBeInTheDocument();
    expect(within(locationSelect).queryByRole('option', {
      name: 'Refrigeración de semielaborados',
    })).not.toBeInTheDocument();
    expect(within(locationSelect).getByRole('option', {
      name: 'Congelador de producto terminado',
    })).toBeInTheDocument();

    fireEvent.change(inspectionSelect, {
      target: { value: 'mass-inspection' },
    });

    expect(screen.getByRole('option', { name: /2\.15 kg/ })).toBeInTheDocument();
    expect(within(locationSelect).getByRole('option', {
      name: /Refrigeración de semielaborados · Semielaborado refrigerado/,
    })).toBeInTheDocument();
    expect(within(locationSelect).queryByRole('option', {
      name: 'Congelador de producto terminado',
    })).not.toBeInTheDocument();

    fireEvent.change(locationSelect, {
      target: { value: 'semi-refrigerator' },
    });
    expect(locationSelect).toHaveValue('semi-refrigerator');

    fireEvent.change(screen.getByRole('textbox', { name: /N.mero de lote/ }), {
      target: { value: 'DOUGH-215-UI' },
    });
    fireEvent.change(document.querySelector<HTMLInputElement>('[name="expiration_date"]')!, {
      target: { value: '2099-12-31' },
    });
    fireEvent.change(document.querySelector<HTMLSelectElement>('[name="warehouse_id"]')!, {
      target: { value: 'warehouse' },
    });

    const form = locationSelect.closest('form');
    expect(form).not.toBeNull();
    const formData = new FormData(form!);
    expect(formData.get('quality_inspection_id')).toBe('mass-inspection');
    expect(formData.get('inventory_location_id')).toBe('semi-refrigerator');
    expect(formData.get('lot_number')).toBe('DOUGH-215-UI');
    expect(formData.get('warehouse_id')).toBe('warehouse');
    expect(screen.getByRole('button', { name: 'Liberar masa a inventario' })).toBeEnabled();

    fireEvent.submit(form!);
    await waitFor(() => {
      expect(releaseFinishedProductQualityToInventory).toHaveBeenCalledTimes(1);
    });
    const submitted = vi.mocked(releaseFinishedProductQualityToInventory).mock.calls[0]?.[0];
    expect(submitted).toBeInstanceOf(FormData);
    expect((submitted as FormData).get('quality_inspection_id')).toBe('mass-inspection');
    expect((submitted as FormData).get('inventory_location_id')).toBe('semi-refrigerator');
    expect((submitted as FormData).get('lot_number')).toBe('DOUGH-215-UI');
  });
});
