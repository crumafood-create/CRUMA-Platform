import { describe, expect, it } from 'vitest';

import {
  buildRecipeInsert,
  buildRecipeItemDelete,
  buildRecipeItemInsert,
  buildRecipeItemUpdate,
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
    product_id: '',
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
    expect(recipe).not.toHaveProperty('product_id');
    expect(recipe).not.toHaveProperty('unit_of_measure_id');
  });

  it('permite editar los campos variables sin aceptar identidad desde el formulario', () => {
    const form = new FormData();
    form.set('name', ' Tequeños Party de queso ');
    form.set('yield_quantity', '100');
    form.set('is_active', 'true');
    form.set('product_id', 'another-product');
    form.set('unit_of_measure_id', 'another-unit');

    expect(buildRecipeUpdate(form, '2026-11-10T00:00:00.000Z')).toEqual({
      name: 'Tequeños Party de queso',
      description: null,
      yield_quantity: 100,
      is_active: true,
      updated_at: '2026-11-10T00:00:00.000Z',
    });
  });
});

describe('contrato tipado de ingredientes de receta', () => {
  it('usa raw_material_id y normaliza la cantidad', () => {
    expect(buildRecipeItemInsert(itemForm())).toEqual({
      recipe_id: 'recipe-1',
      raw_material_id: 'material-1',
      product_id: null,
      quantity: 2.75,
    });
  });

  it('identifica el renglón al actualizar su ingrediente o cantidad', () => {
    expect(buildRecipeItemUpdate(itemForm({ id: ' item-1 ' }))).toEqual({
      id: 'item-1',
      recipe_id: 'recipe-1',
      raw_material_id: 'material-1',
      product_id: null,
      quantity: 2.75,
    });
  });

  it('rechaza una actualización sin el ID del renglón', () => {
    expect(() => buildRecipeItemUpdate(itemForm())).toThrow(
      'El campo id es obligatorio.',
    );
  });

  it('construye la eliminación de un renglón dentro de su receta', () => {
    expect(buildRecipeItemDelete(itemForm({ id: ' item-1 ' }))).toEqual({
      id: 'item-1',
      recipe_id: 'recipe-1',
    });
  });

  it('permite usar un producto intermedio como ingrediente en su unidad base', () => {
    expect(buildRecipeItemInsert(itemForm({
      raw_material_id: '',
      product_id: 'masa-standard',
    }))).toEqual({
      recipe_id: 'recipe-1',
      raw_material_id: null,
      product_id: 'masa-standard',
      quantity: 2.75,
    });
  });

  it('rechaza un ingrediente sin materia prima ni producto', () => {
    expect(() => buildRecipeItemInsert(itemForm({ raw_material_id: '' }))).toThrow(
      'Selecciona una materia prima o un producto intermedio, pero no ambos.',
    );
  });

  it('rechaza un ingrediente con materia prima y producto a la vez', () => {
    expect(() => buildRecipeItemInsert(itemForm({ product_id: 'masa-standard' }))).toThrow(
      'Selecciona una materia prima o un producto intermedio, pero no ambos.',
    );
  });

  it.each(['recipe_id'])(
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
