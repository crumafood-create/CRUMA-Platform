import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RawMaterialForm } from './raw-material-form';

describe('RawMaterialForm', () => {
  it('keeps inventory-owned values read-only when editing', () => {
    const { container } = render(
      <RawMaterialForm
        action={vi.fn().mockResolvedValue(undefined)}
        initialValues={{
          name: 'Harina de trigo',
          current_stock: 12.5,
          average_cost: 3.25,
          last_cost: 4.1,
          minimum_stock: 2,
        }}
      />,
    );
    const currentStock = container.querySelector<HTMLInputElement>(
      'input[name="current_stock"]',
    );
    const averageCost = container.querySelector<HTMLInputElement>(
      'input[name="average_cost"]',
    );
    const lastCost = container.querySelector<HTMLInputElement>(
      'input[name="last_cost"]',
    );

    expect(currentStock).toHaveValue(12.5);
    expect(currentStock).toHaveAttribute('readonly');
    expect(averageCost).toHaveValue(3.25);
    expect(averageCost).toHaveAttribute('readonly');
    expect(lastCost).toHaveValue(4.1);
    expect(lastCost).toHaveAttribute('readonly');
    expect(container.querySelector('input[name="name"]')).not.toHaveAttribute('readonly');
    expect(container.querySelector('input[name="minimum_stock"]')).not.toHaveAttribute('readonly');
  });
});
