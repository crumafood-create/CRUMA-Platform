import { fireEvent, render, screen } from '@testing-library/react';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { expect, it, vi } from 'vitest';

import NewProductPage from './page';

const { createClient, authorize } = vi.hoisted(() => ({ createClient: vi.fn(), authorize: vi.fn() }));
vi.mock('@/infrastructure/integrations/supabase/server', () => ({ createTypedClient: createClient }));
vi.mock('@/modules/identity/guards/action.guard', () => ({ requireTypedAuthorizedAction: authorize }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

it('muestra el rechazo de la acción real desde el alta y conserva los datos sin redirigir', async () => {
  const insert = vi.fn().mockResolvedValue({ error: {
    code: '23505', message: 'duplicate key violates unique constraint "products_slug_key"',
  } });
  const supabase = { from(table: string) {
    const query = {
      select: () => query, is: () => query, eq: () => query, insert,
      order: async () => ({ error: null, data: table === 'units_of_measure'
        ? [{ id: 'unit-1', name: 'Unidad', code: 'UN' }] : [] }),
    };
    return query;
  } };
  createClient.mockResolvedValue(supabase);
  authorize.mockResolvedValue({ supabase });
  const { container } = render(await NewProductPage());
  const form = container.querySelector('form')!;
  const values = { name: 'Pan integral', slug: 'pan-integral', internal_code: 'SKU-001',
    description: 'Pan de trigo', min_stock: '12', status: 'draft', unit_of_measure_id: 'unit-1' };
  for (const [name, value] of Object.entries(values)) {
    fireEvent.change(form.querySelector(`[name="${name}"]`)!, { target: { value } });
  }
  expect(form).toBeValid();
  fireEvent.submit(form);

  expect(await screen.findByRole('alert')).toHaveTextContent('Ya existe un producto con ese slug.');
  expect(Object.fromEntries(new FormData(form))).toMatchObject(values);
  expect(insert).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ ...values, min_stock: 12 }));
  expect(revalidatePath).not.toHaveBeenCalled();
  expect(redirect).not.toHaveBeenCalled();
});
