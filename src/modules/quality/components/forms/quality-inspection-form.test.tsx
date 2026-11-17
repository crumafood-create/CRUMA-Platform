import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { QualityInspectionForm } from './quality-inspection-form';

describe('QualityInspectionForm para muestra reservada', () => {
  it('presenta el lote y la cantidad calculada como campos de solo lectura', () => {
    const { container } = render(
      <QualityInspectionForm
        action={async () => undefined}
        outputs={[]}
        sample={{
          id: 'sample-1',
          label: 'Tequeños Party Queso Crudos · lote PARTY-001',
          quantity: 2,
        }}
      />,
    );

    expect(screen.getByDisplayValue('2 piezas')).toHaveAttribute('readonly');
    expect(screen.getByDisplayValue(/PARTY-001/)).toHaveAttribute('readonly');
    expect(container.querySelector('[name="sampled_quantity"]')).toBeNull();
    expect(container.querySelector('select[name="production_output_id"]')).toBeNull();
  });
});
