import { describe, expect, it } from 'vitest';

import {
  buildCategoryInsert,
  buildCategoryUpdate,
  buildFamilyInsert,
  buildFamilyUpdate,
  normalizeCategoryFormValues,
  normalizeFamilyFormValues,
} from './category-family-contract';

function formWith(entries: Record<string, string>): FormData {
  const form = new FormData();

  Object.entries(entries).forEach(([field, value]) => form.set(field, value));

  return form;
}

function categoryForm(entries: Record<string, string> = {}): FormData {
  return formWith({ name: '  Harinas  ', slug: '  harinas  ', ...entries });
}

function familyForm(entries: Record<string, string> = {}): FormData {
  return formWith({
    category_id: ' category-1 ',
    name: '  Trigo  ',
    slug: '  trigo  ',
    internal_code: '  TRI-001  ',
    ...entries,
  });
}

describe('contrato tipado de categorías', () => {
  it('normaliza nombres, slugs, descripciones y estados', () => {
    const category = buildCategoryInsert(categoryForm({
      description: '  Insumos secos  ',
      is_active: 'true',
    }));

    expect(category.name).toBe('Harinas');
    expect(category.slug).toBe('harinas');
    expect(category.description).toBe('Insumos secos');
    expect(category.is_active).toBe(true);
  });

  it.each(['name', 'slug'])(
    'rechaza campos obligatorios vacíos: %s',
    (field) => expect(() => buildCategoryInsert(categoryForm({ [field]: '  ' })))
      .toThrow(`El campo ${field} es obligatorio.`),
  );

  it('normaliza descripciones vacías y conserva categorías inactivas', () => {
    const category = buildCategoryInsert(categoryForm({
      description: '  ',
      is_active: 'false',
    }));

    expect(category.description).toBe(null);
    expect(category.is_active).toBe(false);
  });

  it('incluye la fecha explícita en actualizaciones', () => {
    expect(buildCategoryUpdate(categoryForm(), '2026-08-23T00:00:00.000Z').updated_at)
      .toBe('2026-08-23T00:00:00.000Z');
  });

  it('normaliza valores heredados nulos para el formulario', () => {
    const category = normalizeCategoryFormValues({
      name: 'Harinas',
      slug: 'harinas',
      description: null,
      is_active: null,
    });

    expect(category.description).toBe('');
    expect(category.is_active).toBe(true);
  });
});

describe('contrato tipado de familias de materias primas', () => {
  it('normaliza la categoría, el nombre, el slug y el código interno', () => {
    const family = buildFamilyInsert(familyForm({
      description: '  Harina de trigo  ',
      is_active: 'true',
    }));

    expect(family.category_id).toBe('category-1');
    expect(family.name).toBe('Trigo');
    expect(family.slug).toBe('trigo');
    expect(family.internal_code).toBe('TRI-001');
    expect(family.description).toBe('Harina de trigo');
    expect(family.is_active).toBe(true);
  });

  it.each(['category_id', 'name', 'slug', 'internal_code'])(
    'rechaza campos obligatorios vacíos: %s',
    (field) => expect(() => buildFamilyInsert(familyForm({ [field]: '  ' })))
      .toThrow(`El campo ${field} es obligatorio.`),
  );

  it('normaliza descripciones opcionales y familias inactivas', () => {
    const family = buildFamilyInsert(familyForm({ is_active: 'false' }));

    expect(family.description).toBe(null);
    expect(family.is_active).toBe(false);
  });

  it('incluye la fecha explícita en actualizaciones', () => {
    expect(buildFamilyUpdate(familyForm(), '2026-08-23T00:00:00.000Z').updated_at)
      .toBe('2026-08-23T00:00:00.000Z');
  });

  it('normaliza valores heredados nulos para el formulario', () => {
    const family = normalizeFamilyFormValues({
      category_id: 'category-1',
      name: 'Trigo',
      slug: 'trigo',
      internal_code: 'TRI-001',
      description: null,
      is_active: null,
    });

    expect(family.description).toBe('');
    expect(family.is_active).toBe(true);
  });
});
