import { fireEvent, render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { buildProductInsert } from '@/modules/inventory/application/product-catalog-contract';

import { ProductForm } from './product-form';

it('muestra el rechazo del servidor y conserva los datos capturados', async () => {
  for (const message of ['Ya existe un producto con ese slug.', 'Ya existe un producto con ese código interno.']) {
    const action = vi.fn().mockResolvedValue({ error: message });
    const { container, unmount } = render(<ProductForm action={action}
      unitsOfMeasure={[{ id: 'unit-1', name: 'Unidad', code: 'UN' }]}
      initialValues={{ unit_of_measure_id: 'unit-1' }} />);
    const form = container.querySelector('form')!;
    fireEvent.change(screen.getByPlaceholderText('Tequeños Tradicionales Queso'), { target: { value: 'Pan integral' } });
    fireEvent.change(screen.getByPlaceholderText('MP-AGUA'), { target: { value: 'SKU-001' } });
    fireEvent.change(form.querySelector('[name="description"]')!, { target: { value: 'Pan de trigo' } });
    fireEvent.change(form.querySelector('[name="min_stock"]')!, { target: { value: '12' } });
    fireEvent.change(form.querySelector('[name="status"]')!, { target: { value: 'draft' } });
    const expected = { name: 'Pan integral', slug: 'pan-integral', internal_code: 'SKU-001',
      description: 'Pan de trigo', min_stock: '12', status: 'draft', unit_of_measure_id: 'unit-1' };

    fireEvent.submit(form);

    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(action).toHaveBeenCalledOnce();
    expect(Object.fromEntries(action.mock.calls[0]![0])).toMatchObject(expected);
    expect(Object.fromEntries(new FormData(form))).toMatchObject(expected);
    unmount();
  }
});

it('muestra los estados acordados y exige nombre y slug', () => {
  const { container } = render(<ProductForm action={vi.fn()}
    unitsOfMeasure={[{ id: 'unit-1', name: 'Unidad', code: 'UN' }]}
    initialValues={{ unit_of_measure_id: 'unit-1' }} />);
  const name = screen.getByPlaceholderText('Tequeños Tradicionales Queso');
  const slug = screen.getByPlaceholderText('tequenos-tradicionales-queso');
  for (const field of [name, slug]) {
    expect(field).toBeRequired();
    expect(field).toBeInvalid();
  }
  const status = screen.getByRole('option', { name: 'Activo' }).closest('select')!;
  expect(within(status).getAllByRole('option').map((option) => [option.textContent, (option as HTMLOptionElement).value]))
    .toEqual([['Activo', 'active'], ['Borrador', 'draft'], ['Archivado', 'archived']]);
  expect(status).toHaveValue('active');

  fireEvent.change(name, { target: { value: 'Pan integral' } });
  fireEvent.change(name, { target: { value: '' } });
  expect(name).toBeInvalid();
  fireEvent.change(name, { target: { value: 'Pan integral' } });
  fireEvent.change(slug, { target: { value: '' } });
  expect(slug).toBeInvalid();
  fireEvent.change(slug, { target: { value: 'pan-integral' } });
  expect(container.querySelector('form')).toBeValid();
  for (const value of ['active', 'draft', 'archived']) {
    fireEvent.change(status, { target: { value } });
    expect(buildProductInsert(new FormData(container.querySelector('form')!)).status).toBe(value);
  }
});

it('permite omitir el código interno y conserva el código proporcionado', () => {
  const { container } = render(<ProductForm action={vi.fn()}
    unitsOfMeasure={[{ id: 'unit-1', name: 'Unidad', code: 'UN' }]}
    initialValues={{ name: 'Pan integral', slug: 'pan-integral', unit_of_measure_id: 'unit-1' }} />);
  const form = container.querySelector('form')!;
  const code = screen.getByPlaceholderText('MP-AGUA');

  expect(code).not.toBeRequired();
  expect(screen.getByText('Código Interno (opcional)')).toBeInTheDocument();
  expect(form).toBeValid();
  expect(buildProductInsert(new FormData(form)).internal_code).toBeNull();
  const omittedCode = new FormData(form);
  omittedCode.delete('internal_code');
  expect(buildProductInsert(omittedCode).internal_code).toBeNull();

  fireEvent.change(code, { target: { value: '   ' } });
  expect(buildProductInsert(new FormData(form)).internal_code).toBeNull();
  fireEvent.change(code, { target: { value: ' SKU-001 ' } });
  expect(buildProductInsert(new FormData(form)).internal_code).toBe('SKU-001');
});
