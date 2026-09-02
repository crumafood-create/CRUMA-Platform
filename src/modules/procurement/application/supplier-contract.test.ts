import { describe, expect, it } from 'vitest';

import {
  buildSupplierInsert,
  buildSupplierUpdate,
  normalizeSupplierFormValues,
} from './supplier-contract';

function supplierForm(overrides: Record<string, string> = {}): FormData {
  const form = new FormData();
  const values = {
    name: ' Proveedor Central ',
    business_name: ' Comercial Central, S.A. de C.V. ',
    tax_id: ' abc010101ab1 ',
    email: ' VENTAS@EJEMPLO.COM ',
    phone: ' 722 123 4567 ',
    contact_name: ' Ana Pérez ',
    address: ' Toluca, México ',
    notes: ' Entrega semanal ',
    is_active: 'true',
    ...overrides,
  };

  for (const [field, value] of Object.entries(values)) form.set(field, value);
  return form;
}

describe('contrato tipado de proveedores', () => {
  it('normaliza todos los campos del proveedor', () => {
    expect(buildSupplierInsert(supplierForm())).toEqual({
      name: 'Proveedor Central',
      business_name: 'Comercial Central, S.A. de C.V.',
      tax_id: 'ABC010101AB1',
      email: 'ventas@ejemplo.com',
      phone: '722 123 4567',
      contact_name: 'Ana Pérez',
      address: 'Toluca, México',
      notes: 'Entrega semanal',
      is_active: true,
    });
  });

  it('rechaza nombres vacíos', () => {
    expect(() => buildSupplierInsert(supplierForm({ name: ' ' }))).toThrow(
      'El campo name es obligatorio.',
    );
  });

  it.each([
    'business_name', 'tax_id', 'email', 'phone', 'contact_name', 'address', 'notes',
  ] as const)(
    'normaliza el campo opcional vacío como null: %s',
    (field) => {
      expect(buildSupplierInsert(supplierForm({ [field]: ' ' }))[field]).toBe(null);
    },
  );

  it.each(['correo', 'a@b', '@ejemplo.com', 'a@ejemplo'])(
    'rechaza correos inválidos: %s',
    (email) => {
      expect(() => buildSupplierInsert(supplierForm({ email }))).toThrow(
        'El correo del proveedor no es válido.',
      );
    },
  );

  it('conserva proveedores inactivos', () => {
    expect(buildSupplierInsert(supplierForm({ is_active: 'false' })).is_active).toBe(false);
  });

  it('rechaza estados fuera del contrato', () => {
    expect(() => buildSupplierInsert(supplierForm({ is_active: 'activo' }))).toThrow(
      'Estado de proveedor inválido.',
    );
  });

  it('añade una fecha ISO explícita al editar', () => {
    const supplier = buildSupplierUpdate(supplierForm(), '2026-09-02T05:00:00.000Z');
    expect(supplier.updated_at).toBe('2026-09-02T05:00:00.000Z');
  });

  it('normaliza campos nullable para el formulario', () => {
    const values = normalizeSupplierFormValues({
      name: 'Central', business_name: null, tax_id: null, email: null,
      phone: null, contact_name: null, address: null, notes: null, is_active: true,
    });

    expect(values).toEqual({
      name: 'Central', business_name: '', tax_id: '', email: '', phone: '',
      contact_name: '', address: '', notes: '', is_active: true,
    });
  });
});
