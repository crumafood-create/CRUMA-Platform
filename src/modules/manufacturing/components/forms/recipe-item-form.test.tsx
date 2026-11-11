import { fireEvent, render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { RecipeItemForm } from './recipe-item-form';

it('muestra las unidades y captura materias primas o una variedad intermedia', () => {
  const action = vi.fn();
  const { container } = render(
    <RecipeItemForm
      recipeId="party-recipe"
      materials={[{ id: 'flour', name: 'Harina', unitLabel: 'kg - Kilogramos' }]}
      intermediateProducts={[{ id: 'dough', name: 'Masa actual', unitLabel: 'kg - Kilogramos' }]}
      action={action}
    />,
  );

  const materialSelect = screen.getByRole('option', { name: 'Harina · kg - Kilogramos' }).closest('select')!;
  const productSelect = screen.getByRole('option', { name: 'Masa actual · kg - Kilogramos' }).closest('select')!;

  expect(within(materialSelect).getByRole('option', { name: 'Harina · kg - Kilogramos' })).toHaveValue('flour');
  expect(within(productSelect).getByRole('option', { name: 'Masa actual · kg - Kilogramos' })).toHaveValue('dough');

  fireEvent.change(productSelect, { target: { value: 'dough' } });
  fireEvent.change(container.querySelector('[name="quantity"]')!, { target: { value: '2' } });

  const submitted = new FormData(container.querySelector('form')!);
  expect(Object.fromEntries(submitted)).toMatchObject({
    recipe_id: 'party-recipe',
    raw_material_id: '',
    product_id: 'dough',
    quantity: '2',
  });
  expect(screen.getByText(/Cada receta final admite una variedad de masa/)).toBeInTheDocument();
});

it('carga ingrediente y cantidad actuales para editar el renglón', () => {
  const { container } = render(
    <RecipeItemForm
      recipeId="party-recipe"
      materials={[{ id: 'cheese', name: 'Queso', unitLabel: 'kg - Kilogramos' }]}
      intermediateProducts={[]}
      action={vi.fn()}
      initialValues={{ id: 'item-1', raw_material_id: 'cheese', product_id: null, quantity: 1 }}
    />,
  );

  const submitted = new FormData(container.querySelector('form')!);
  expect(Object.fromEntries(submitted)).toMatchObject({
    id: 'item-1',
    recipe_id: 'party-recipe',
    raw_material_id: 'cheese',
    product_id: '',
    quantity: '1',
  });
  expect(screen.getByRole('button', { name: 'Guardar ingrediente' })).toBeInTheDocument();
});
