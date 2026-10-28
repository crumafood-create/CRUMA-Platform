import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RawMaterialLotAdjustmentForm } from './raw-material-lot-adjustment-form';

describe('RawMaterialLotAdjustmentForm', () => {
  it('muestra los lotes disponibles y su ubicación, y exige motivo', () => {
    const { container } = render(
      <RawMaterialLotAdjustmentForm
        action={vi.fn().mockResolvedValue(undefined)}
        lots={[
          {
            id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            materialName: 'Harina de trigo',
            lotNumber: 'LOT-17',
            locationName: 'Almacén A / Estante 2',
            availableQuantity: 6,
            unitName: 'kg',
          },
          {
            id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
            materialName: 'Queso',
            lotNumber: 'LOT-18',
            locationName: 'Almacén B / Rack 3',
            availableQuantity: 3,
            unitName: 'kg',
          },
        ]}
      />,
    );

    const lotSelector = container.querySelector<HTMLSelectElement>('select[name="lot_id"]');
    const reason = container.querySelector<HTMLTextAreaElement>('textarea[name="reason"]');

    expect(screen.getByRole('option', { name:
      'Harina de trigo · Lote LOT-17 · Almacén A / Estante 2 · 6 kg',
    })).toBeInTheDocument();
    expect(screen.getByRole('option', { name:
      'Queso · Lote LOT-18 · Almacén B / Rack 3 · 3 kg',
    })).toBeInTheDocument();
    expect(lotSelector).toHaveValue('');
    expect(lotSelector).toBeRequired();
    expect(container.querySelector('[name="location_id"]')).toBeNull();
    expect(reason).toBeRequired();
    expect(screen.getByRole('option', { name: 'Aumentar' })).toHaveValue('entry');
    expect(screen.getByRole('option', { name: 'Disminuir' })).toHaveValue('exit');
    expect(screen.queryByRole('option', { name: 'Ajuste' })).not.toBeInTheDocument();
  });
});
