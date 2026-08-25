import { describe, expect, it } from 'vitest';

import {
  buildInventoryLocationInsert,
  buildInventoryLocationUpdate,
  normalizeInventoryLocationFormValues,
} from './inventory-location-contract';

function locationForm(overrides: Record<string, string> = {}): FormData {
  const form = new FormData();
  const values = {
    slug: '  zona a 01  ',
    name: '  Congelador principal  ',
    description: '  Insumos refrigerados  ',
    zone: '  A  ',
    aisle: '1',
    rack: '2',
    level: '3',
    position: '4',
    is_active: 'on',
    ...overrides,
  };

  for (const [field, value] of Object.entries(values)) form.set(field, value);

  return form;
}

describe('contrato tipado de ubicaciones de inventario', () => {
  it('normaliza código, textos y coordenadas enteras', () => {
    expect(buildInventoryLocationInsert(locationForm())).toEqual({
      slug: 'ZONA-A-01',
      name: 'Congelador principal',
      description: 'Insumos refrigerados',
      zone: 'A',
      aisle: 1,
      rack: 2,
      level: 3,
      position: 4,
      is_active: true,
    });
  });

  it.each(['slug', 'name', 'zone'])(
    'rechaza campos obligatorios vacíos: %s',
    (field) => {
      expect(() => buildInventoryLocationInsert(locationForm({ [field]: ' ' }))).toThrow(
        `El campo ${field} es obligatorio.`,
      );
    },
  );

  it.each(['aisle', 'rack', 'level', 'position'])(
    'rechaza coordenadas negativas: %s',
    (field) => {
      expect(() => buildInventoryLocationInsert(locationForm({ [field]: '-1' }))).toThrow(
        `El campo ${field} debe ser un entero no negativo y seguro.`,
      );
    },
  );

  it.each(['1.5', 'NaN', 'Infinity', '9007199254740992'])(
    'rechaza coordenadas inválidas o inseguras: %s',
    (value) => {
      expect(() => buildInventoryLocationInsert(locationForm({ aisle: value }))).toThrow(
        'El campo aisle debe ser un entero no negativo y seguro.',
      );
    },
  );

  it('normaliza descripciones y coordenadas opcionales vacías', () => {
    const location = buildInventoryLocationInsert(
      locationForm({ description: ' ', aisle: '', rack: '' }),
    );

    expect(location.description).toBe(null);
    expect(location.aisle).toBe(0);
    expect(location.rack).toBe(0);
  });

  it('conserva ubicaciones inactivas', () => {
    expect(buildInventoryLocationInsert(locationForm({ is_active: '' })).is_active).toBe(false);
  });

  it('incluye fechas ISO explícitas en actualizaciones', () => {
    const location = buildInventoryLocationUpdate(locationForm(), '2026-08-25T04:00:00.000Z');

    expect(location.updated_at).toBe('2026-08-25T04:00:00.000Z');
  });

  it('normaliza valores heredados nulos para la interfaz', () => {
    const location = normalizeInventoryLocationFormValues({
      id: 'location-1',
      slug: 'A-01',
      name: 'Congelador',
      description: null,
      zone: null,
      aisle: null,
      rack: null,
      level: null,
      position: null,
      is_active: null,
    });

    expect(location.zone).toBe('');
    expect(location.aisle).toBe(0);
    expect(location.description).toBe(null);
    expect(location.is_active).toBe(true);
  });
});
