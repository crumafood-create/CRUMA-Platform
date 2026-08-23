import { describe, expect, it } from 'vitest';

import {
  buildProductInsert,
  buildProductUpdate,
  normalizeProductFormValues,
} from './product-catalog-contract';

function productForm(entries: Record<string, string> = {}): FormData {
  const form = new FormData();

  Object.entries({ name: '  Pan integral  ', slug: '  pan-integral  ', ...entries })
    .forEach(([field, value]) => form.set(field, value));

  return form;
}

describe('contrato tipado del catálogo de productos', () => {
  it('normaliza los campos obligatorios, opcionales y cantidades', () => {
    const result = buildProductInsert(productForm({
      category_id: ' category-1 ',
      family_id: ' family-1 ',
      min_stock: '12.5',
      internal_code: ' SKU-001 ',
      is_featured: 'on',
    }));

    expect(result.name).toBe('Pan integral');
    expect(result.slug).toBe('pan-integral');
    expect(result.category_id).toBe('category-1');
    expect(result.family_id).toBe('family-1');
    expect(result.internal_code).toBe('SKU-001');
    expect(result.min_stock).toBe(12.5);
    expect(result.status).toBe('active');
    expect(result.is_featured).toBe(true);
    expect(result.description).toBe(null);
  });

  it.each(['active', 'inactive', 'draft'])(
    'acepta estado canónico: %s',
    (status) => expect(buildProductInsert(productForm({ status })).status).toBe(status),
  );

  it.each(['pending', 'archived'])(
    'rechaza estado fuera del contrato: %s',
    (status) => expect(() => buildProductInsert(productForm({ status })))
      .toThrow('Estado de producto inválido.'),
  );

  it.each(['name', 'slug'])(
    'rechaza campo obligatorio vacío: %s',
    (field) => expect(() => buildProductInsert(productForm({ [field]: '  ' })))
      .toThrow(`El campo ${field} es obligatorio.`),
  );

  it.each(['-1', 'Infinity', 'texto'])(
    'rechaza stock mínimo inválido: %s',
    (min_stock) => expect(() => buildProductInsert(productForm({ min_stock })))
      .toThrow('El campo min_stock debe ser un número no negativo y finito.'),
  );

  it.each(['category_id', 'family_id'])(
    'rechaza categorías y familias incompletas: %s',
    (field) => expect(() => buildProductInsert(productForm({ [field]: 'id-1' }))).toThrow(
      'Categoría y familia deben seleccionarse juntas.',
    ),
  );

  it('acepta categorías y familias simultáneamente vacías', () => {
    const result = buildProductInsert(productForm());

    expect(result.category_id).toBe(null);
    expect(result.family_id).toBe(null);
    expect(result.min_stock).toBe(0);
    expect(result.is_featured).toBe(false);
  });

  it('preserva el contrato en edición y añade la fecha de actualización', () => {
    const result = buildProductUpdate(productForm(), '2026-08-23T00:00:00.000Z');

    expect(result.name).toBe('Pan integral');
    expect(result.updated_at).toBe('2026-08-23T00:00:00.000Z');
  });

  it('normaliza valores nulos existentes para el formulario de edición', () => {
    const result = normalizeProductFormValues({
      name: 'Pan integral',
      slug: 'pan-integral',
      internal_code: null,
      category_id: null,
      family_id: null,
      flavor_id: null,
      preparation_type_id: null,
      unit_of_measure_id: null,
      short_description: null,
      description: null,
      image_url: null,
      image_alt: null,
      seo_title: null,
      seo_description: null,
      status: null,
      is_featured: null,
      min_stock: null,
    });

    expect(result.category_id).toBe('');
    expect(result.description).toBe('');
    expect(result.status).toBe('active');
    expect(result.is_featured).toBe(false);
    expect(result.min_stock).toBe(0);
  });
});
