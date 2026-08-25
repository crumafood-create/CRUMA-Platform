import { describe, expect, it } from 'vitest';

import {
  buildFlavorInsert,
  buildFlavorUpdate,
  normalizeFlavorFormValues,
} from './flavor-catalog-contract';

function flavorForm(overrides: Record<string, string> = {}): FormData {
  const form = new FormData();
  const values = {
    name: '  Queso  ',
    slug: '  queso  ',
    description: '  Queso tradicional  ',
    is_active: 'true',
    ...overrides,
  };

  for (const [field, value] of Object.entries(values)) form.set(field, value);

  return form;
}

describe('contrato tipado del catálogo de sabores', () => {
  it('normaliza los campos obligatorios y la descripción', () => {
    expect(buildFlavorInsert(flavorForm())).toEqual({
      name: 'Queso',
      slug: 'queso',
      description: 'Queso tradicional',
      is_active: true,
    });
  });

  it.each(['name', 'slug'])('rechaza campos obligatorios vacíos: %s', (field) => {
    expect(() => buildFlavorInsert(flavorForm({ [field]: '  ' }))).toThrow(
      `El campo ${field} es obligatorio.`,
    );
  });

  it('normaliza descripciones vacías y conserva sabores inactivos', () => {
    const flavor = buildFlavorInsert(flavorForm({ description: ' ', is_active: 'false' }));

    expect(flavor.description).toBe(null);
    expect(flavor.is_active).toBe(false);
  });

  it('incluye marcas temporales ISO explícitas en actualizaciones', () => {
    const flavor = buildFlavorUpdate(flavorForm(), '2026-08-25T04:00:00.000Z');

    expect(flavor.updated_at).toBe('2026-08-25T04:00:00.000Z');
  });

  it('normaliza valores nulos para el formulario de edición', () => {
    const flavor = normalizeFlavorFormValues({
      name: 'Queso',
      slug: 'queso',
      description: null,
      is_active: true,
    });

    expect(flavor.description).toBe('');
    expect(flavor.name).toBe('Queso');
    expect(flavor.is_active).toBe(true);
  });
});
