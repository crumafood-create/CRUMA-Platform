import { describe, expect, it } from 'vitest';

import {
  buildWarehouseInsert,
  buildWarehouseUpdate,
  normalizeWarehouseFormValues,
} from './warehouse-contract';

function warehouseForm(overrides: Record<string, string> = {}): FormData {
  const form = new FormData();
  const values = {
    name: ' Almacén congelados ',
    code: ' frz-01 ',
    description: ' Producto congelado ',
    is_active: 'true',
    ...overrides,
  };

  for (const [field, value] of Object.entries(values)) form.set(field, value);

  return form;
}

describe('contrato tipado de almacenes', () => {
  it('normaliza nombre, código, descripción y estado', () => {
    expect(buildWarehouseInsert(warehouseForm())).toEqual({
      name: 'Almacén congelados',
      code: 'FRZ-01',
      description: 'Producto congelado',
      is_active: true,
    });
  });

  it.each(['name', 'code'])('rechaza campos obligatorios vacíos: %s', (field) => {
    expect(() => buildWarehouseInsert(warehouseForm({ [field]: ' ' }))).toThrow(
      `El campo ${field} es obligatorio.`,
    );
  });

  it('normaliza la descripción vacía como null', () => {
    expect(buildWarehouseInsert(warehouseForm({ description: ' ' })).description).toBe(null);
  });

  it('conserva almacenes inactivos', () => {
    expect(buildWarehouseInsert(warehouseForm({ is_active: 'false' })).is_active).toBe(false);
  });

  it('rechaza estados fuera del contrato', () => {
    expect(() => buildWarehouseInsert(warehouseForm({ is_active: 'activo' }))).toThrow(
      'Estado de almacén inválido.',
    );
  });

  it('añade una fecha ISO explícita en edición', () => {
    const warehouse = buildWarehouseUpdate(
      warehouseForm(),
      '2026-08-31T05:00:00.000Z',
    );

    expect(warehouse.updated_at).toBe('2026-08-31T05:00:00.000Z');
  });

  it('normaliza valores heredados para el formulario', () => {
    expect(
      normalizeWarehouseFormValues({
        name: 'Principal',
        code: 'MAIN',
        description: null,
        is_active: true,
      }),
    ).toEqual({
      name: 'Principal',
      code: 'MAIN',
      description: '',
      is_active: true,
    });
  });
});
