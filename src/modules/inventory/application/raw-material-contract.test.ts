import { describe, expect, it } from 'vitest';

import {
  buildRawMaterialInsert,
  buildRawMaterialUpdate,
  normalizeRawMaterialFormValues,
} from './raw-material-contract';

function materialForm(overrides: Record<string, string> = {}): FormData {
  const form = new FormData();
  const values = {
    name: ' Harina de trigo ',
    slug: ' harina-de-trigo ',
    internal_code: ' MP-HARINA ',
    category_id: 'category-1',
    family_id: 'family-1',
    unit_of_measure_id: 'unit-1',
    current_stock: '12.5',
    minimum_stock: '2',
    average_cost: '18.75',
    last_cost: '19',
    description: ' Ingrediente base ',
    is_active: 'true',
    ...overrides,
  };

  for (const [key, value] of Object.entries(values)) form.set(key, value);

  return form;
}

describe('contrato tipado de materias primas', () => {
  it('normaliza campos obligatorios, relaciones opcionales y cantidades', () => {
    expect(buildRawMaterialInsert(materialForm())).toEqual({
      name: 'Harina de trigo',
      slug: 'harina-de-trigo',
      internal_code: 'MP-HARINA',
      category_id: 'category-1',
      family_id: 'family-1',
      unit_of_measure_id: 'unit-1',
      current_stock: 12.5,
      minimum_stock: 2,
      average_cost: 18.75,
      last_cost: 19,
      description: 'Ingrediente base',
      is_active: true,
    });
  });

  it.each(['name', 'slug'])(
    'rechaza campos obligatorios vacíos: %s',
    (field) => {
      expect(() => buildRawMaterialInsert(materialForm({ [field]: '  ' }))).toThrow(
        `El campo ${field} es obligatorio.`,
      );
    },
  );

  it('convierte relaciones y textos opcionales vacíos en null', () => {
    const result = buildRawMaterialInsert(
      materialForm({ category_id: '', family_id: ' ', description: '', internal_code: '' }),
    );

    expect(result.category_id).toBe(null);
    expect(result.family_id).toBe(null);
    expect(result.description).toBe(null);
    expect(result.internal_code).toBe(null);
  });

  it('permite seleccionar una categoría sin familia', () => {
    const result = buildRawMaterialInsert(materialForm({ family_id: '' }));

    expect(result.category_id).toBe('category-1');
    expect(result.family_id).toBe(null);
  });

  it('rechaza seleccionar una familia sin categoría', () => {
    expect(() => buildRawMaterialInsert(materialForm({ category_id: '' }))).toThrow(
      'La familia de una materia prima requiere una categoría.',
    );
  });

  it.each(['current_stock', 'minimum_stock', 'average_cost', 'last_cost'])(
    'rechaza cantidades negativas: %s',
    (field) => {
      expect(() => buildRawMaterialInsert(materialForm({ [field]: '-1' }))).toThrow(
        `El campo ${field} debe ser un número no negativo y finito.`,
      );
    },
  );

  it.each(['NaN', 'Infinity'])(
    'rechaza cantidades no finitas: %s',
    (value) => {
      expect(() => buildRawMaterialInsert(materialForm({ average_cost: value }))).toThrow(
        'El campo average_cost debe ser un número no negativo y finito.',
      );
    },
  );

  it('normaliza cantidades vacías como cero', () => {
    expect(buildRawMaterialInsert(materialForm({ current_stock: '' })).current_stock).toBe(0);
  });

  it('conserva el estado inactivo sin conversiones implícitas', () => {
    expect(buildRawMaterialInsert(materialForm({ is_active: 'false' })).is_active).toBe(false);
  });

  it('genera una actualización con marca temporal explícita', () => {
    expect(
      buildRawMaterialUpdate(materialForm(), '2026-08-23T12:00:00.000Z').updated_at,
    ).toBe('2026-08-23T12:00:00.000Z');
  });

  it('convierte campos nulos en valores seguros para el formulario', () => {
    const result = normalizeRawMaterialFormValues({
      name: 'Harina',
      slug: 'harina',
      internal_code: null,
      category_id: null,
      family_id: null,
      unit_of_measure_id: null,
      current_stock: 0,
      minimum_stock: 2,
      average_cost: 4,
      last_cost: 5,
      description: null,
      is_active: true,
    });

    expect(result.internal_code).toBe('');
    expect(result.category_id).toBe('');
    expect(result.description).toBe('');
    expect(result.minimum_stock).toBe(2);
  });
});
