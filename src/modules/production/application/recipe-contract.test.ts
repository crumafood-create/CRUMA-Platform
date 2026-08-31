import { describe, expect, it } from 'vitest';

import {
  buildRecipeInsert,
  buildRecipeItemInsert,
  buildRecipeUpdate,
} from './recipe-contract';

function recipeForm(overrides: Record<string, string> = {}): FormData {
  const form = new FormData();
  const values = {
    product_id: ' product-1 ',
    name: ' Masa tradicional ',
    description: ' Fórmula base ',
    yield_quantity: '100.5',
    unit_of_measure_id: ' unit-1 ',
    is_active: 'true',
    ...overrides,
  };

  for (const [field, value] of Object.entries(values)) form.set(field, value);

  return form;
}

function itemForm(overrides: Record<string, string> = {}): FormData {
  const form = new FormData();
  const values = {
    recipe_id: ' recipe-1 ',
    raw_material_id: ' material-1 ',
    quantity: '2.75',
    ...overrides,
  };

  for (const [field, value] of Object.entries(values)) form.set(field, value);

  return form;
}

describe('contrato tipado de recetas', () => {
  it('normaliza una receta completa', () => {
    expect(buildRecipeInsert(recipeForm())).toEqual({
      product_id: 'product-1',
      name: 'Masa tradicional',
      description: 'Fórmula base',
      yield_quantity: 100.5,
      unit_of_measure_id: 'unit-1',
      is_active: true,
    });
  });

  it.each(['product_id', 'name', 'unit_of_measure_id'])(
    'rechaza el campo obligatorio vacío: %s',
    (field) => {
      expect(() => buildRecipeInsert(recipeForm({ [field]: ' ' }))).toThrow(
        `El campo ${field} es obligatorio.`,
      );
    },
  );

  it.each(['', '0', '-1', 'NaN', 'Infinity'])(
    'rechaza rendimientos inválidos: %s',
    (yieldQuantity) => {
      expect(() =>
        buildRecipeInsert(recipeForm({ yield_quantity: yieldQuantity })),
      ).toThrow('El rendimiento debe ser un número finito mayor que cero.');
    },
  );

  it('normaliza descripción vacía y estado inactivo', () => {
    const recipe = buildRecipeInsert(
      recipeForm({ description: ' ', is_active: 'false' }),
    );

    expect(recipe.description).toBe(null);
    expect(recipe.is_active).toBe(false);
  });

  it('rechaza estados fuera del contrato', () => {
    expect(() => buildRecipeInsert(recipeForm({ is_active: 'activa' }))).toThrow(
      'Estado de receta inválido.',
    );
  });

  it('añade fecha ISO explícita en edición', () => {
    const recipe = buildRecipeUpdate(recipeForm(), '2026-08-31T04:00:00.000Z');

    expect(recipe.updated_at).toBe('2026-08-31T04:00:00.000Z');
  });
});

describe('contrato tipado de ingredientes de receta', () => {
  it('usa raw_material_id y normaliza la cantidad', () => {
    expect(buildRecipeItemInsert(itemForm())).toEqual({
      recipe_id: 'recipe-1',
      raw_material_id: 'material-1',
      quantity: 2.75,
    });
  });

  it.each(['recipe_id', 'raw_material_id'])(
    'rechaza referencias vacías: %s',
    (field) => {
      expect(() => buildRecipeItemInsert(itemForm({ [field]: ' ' }))).toThrow(
        `El campo ${field} es obligatorio.`,
      );
    },
  );

  it.each(['', '0', '-1', 'NaN', 'Infinity'])(
    'rechaza cantidades inválidas: %s',
    (quantity) => {
      expect(() => buildRecipeItemInsert(itemForm({ quantity }))).toThrow(
        'La cantidad debe ser un número finito mayor que cero.',
      );
    },
  );
});
