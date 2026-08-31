import { describe, expect, it } from 'vitest';

import {
  buildUnitOfMeasureInsert,
  buildUnitOfMeasureUpdate,
  normalizeUnitOfMeasureFormValues,
} from './unit-of-measure-contract';

function unitForm(overrides: Record<string, string> = {}): FormData {
  const form = new FormData();
  const values = {
    name: '  Kilogramo  ',
    code: '  kg  ',
    description: '  Unidad de masa  ',
    is_active: 'true',
    ...overrides,
  };

  for (const [field, value] of Object.entries(values)) form.set(field, value);

  return form;
}

describe('contrato tipado de unidades de medida', () => {
  it('normaliza nombre, código, descripción y estado', () => {
    expect(buildUnitOfMeasureInsert(unitForm())).toEqual({
      name: 'Kilogramo',
      code: 'kg',
      description: 'Unidad de masa',
      is_active: true,
    });
  });

  it.each(['name', 'code'])('rechaza campos obligatorios vacíos: %s', (field) => {
    expect(() => buildUnitOfMeasureInsert(unitForm({ [field]: '  ' }))).toThrow(
      `El campo ${field} es obligatorio.`,
    );
  });

  it('normaliza la descripción vacía como null', () => {
    expect(buildUnitOfMeasureInsert(unitForm({ description: ' ' })).description).toBe(null);
  });

  it('conserva unidades inactivas', () => {
    expect(buildUnitOfMeasureInsert(unitForm({ is_active: 'false' })).is_active).toBe(false);
  });

  it('rechaza estados fuera del contrato', () => {
    expect(() => buildUnitOfMeasureInsert(unitForm({ is_active: 'activo' }))).toThrow(
      'Estado de unidad de medida inválido.',
    );
  });

  it('añade una fecha ISO explícita en edición', () => {
    const unit = buildUnitOfMeasureUpdate(unitForm(), '2026-08-31T03:00:00.000Z');

    expect(unit.updated_at).toBe('2026-08-31T03:00:00.000Z');
  });

  it('normaliza valores heredados para el formulario', () => {
    const unit = normalizeUnitOfMeasureFormValues({
      name: 'Gramo',
      code: 'g',
      description: null,
      is_active: true,
    });

    expect(unit.description).toBe('');
    expect(unit.is_active).toBe(true);
  });
});
