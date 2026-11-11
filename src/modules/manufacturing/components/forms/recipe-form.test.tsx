import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { RecipeForm } from './recipe-form';

it('mantiene fijo el producto de salida y su unidad durante la edición', () => {
  const { container } = render(
    <RecipeForm
      action={vi.fn()}
      products={[]}
      unitsOfMeasure={[]}
      recipeId="recipe-1"
      outputProductLabel="Tequeños Party de queso · pza"
      outputUnitLabel="pza - Pieza"
      initialValues={{
        product_id: 'party-cheese',
        name: 'Party de queso',
        yield_quantity: 100,
        unit_of_measure_id: 'piece',
        is_active: true,
      }}
    />,
  );

  const form = container.querySelector('form')!;
  const submitted = new FormData(form);
  expect(Object.fromEntries(submitted)).toMatchObject({
    recipe_id: 'recipe-1',
  });
  expect(submitted.has('product_id')).toBe(false);
  expect(submitted.has('unit_of_measure_id')).toBe(false);
  expect(screen.getByText('Tequeños Party de queso · pza')).toBeInTheDocument();
  expect(screen.getByText('pza - Pieza')).toBeInTheDocument();
  expect(form.querySelectorAll('select')).toHaveLength(1);
});
