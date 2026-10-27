import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RawMaterialForm } from './raw-material-form';

describe('RawMaterialForm', () => {
  it('shows zero stock and average cost as read-only on creation', () => {
    const { container } = render(
      <RawMaterialForm action={vi.fn().mockResolvedValue(undefined)} />,
    );
    const currentStock = container.querySelector<HTMLInputElement>(
      'input[name="current_stock"]',
    );
    const averageCost = container.querySelector<HTMLInputElement>(
      'input[name="average_cost"]',
    );

    expect(currentStock).toHaveValue(0);
    expect(currentStock).toHaveAttribute('readonly');
    expect(averageCost).toHaveValue(0);
    expect(averageCost).toHaveAttribute('readonly');
  });

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

  it('retains inputs and shows a validation error after rejected creation', async () => {
    const action = vi.fn()
      .mockRejectedValueOnce(
        new Error('La familia no pertenece a la categoría seleccionada.'),
      )
      .mockResolvedValueOnce(undefined);
    const { container } = render(<RawMaterialForm action={action} />);
    const name = container.querySelector<HTMLInputElement>('input[name="name"]')!;
    const internalCode = container.querySelector<HTMLInputElement>(
      'input[name="internal_code"]',
    )!;
    const slug = container.querySelector<HTMLInputElement>('input[name="slug"]')!;
    const description = container.querySelector<HTMLTextAreaElement>(
      'textarea[name="description"]',
    )!;
    const minimumStock = container.querySelector<HTMLInputElement>(
      'input[name="minimum_stock"]',
    )!;
    const form = container.querySelector('form')!;

    fireEvent.change(name, { target: { value: 'Harina integral' } });
    fireEvent.change(internalCode, { target: { value: 'MP-HARINA-INT' } });
    fireEvent.change(slug, { target: { value: 'harina-integral' } });
    fireEvent.change(description, { target: { value: 'Harina para pruebas' } });
    fireEvent.change(minimumStock, { target: { value: '8' } });
    fireEvent.submit(form);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'La familia no pertenece a la categoría seleccionada.',
    );
    expect(name).toHaveValue('Harina integral');
    expect(internalCode).toHaveValue('MP-HARINA-INT');
    expect(slug).toHaveValue('harina-integral');
    expect(description).toHaveValue('Harina para pruebas');
    expect(minimumStock).toHaveValue(8);

    fireEvent.change(name, { target: { value: 'Harina integral corregida' } });
    fireEvent.submit(form);
    await waitFor(() => expect(action).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(name).toHaveValue('Harina integral corregida');
  });

  it('does not expose internal action error details', async () => {
    const internalMessage =
      'duplicate key value violates unique constraint "raw_materials_slug_key"';
    const action = vi.fn().mockRejectedValue(new Error(internalMessage));
    const { container } = render(<RawMaterialForm action={action} />);

    fireEvent.change(container.querySelector('input[name="name"]')!, {
      target: { value: 'Harina de prueba' },
    });
    fireEvent.change(container.querySelector('input[name="internal_code"]')!, {
      target: { value: 'MP-HARINA-PRUEBA' },
    });
    fireEvent.change(container.querySelector('input[name="slug"]')!, {
      target: { value: 'harina-prueba' },
    });
    fireEvent.submit(container.querySelector('form')!);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'No fue posible guardar la materia prima. Revisa los datos e inténtalo de nuevo.',
    );
    expect(alert).not.toHaveTextContent(internalMessage);
  });
});
