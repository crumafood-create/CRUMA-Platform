import { describe, expect, it } from 'vitest';

import { buildCustomerInsert, buildCustomerUpdate } from './customer-contract';

function form(overrides: Record<string, string> = {}): FormData {
  const data = new FormData();
  const values = {
    customer_code: ' cli-001 ', customer_type: 'business', name: ' Cliente Uno ',
    company_name: ' Empresa Uno ', tax_id: ' abc010101ab1 ',
    email: ' VENTAS@EJEMPLO.COM ', phone: ' 722 123 4567 ', mobile: ' 722 765 4321 ',
    address: ' Toluca ', city: ' Toluca ', state: ' México ', postal_code: ' 50000 ',
    notes: ' Mayorista ', credit_limit: '1250.50', is_active: 'true', ...overrides,
  };
  Object.entries(values).forEach(([key, value]) => data.set(key, value));
  return data;
}

describe('contrato tipado de clientes', () => {
  it('normaliza el alta', () => {
    expect(buildCustomerInsert(form(), 'FALLBACK')).toMatchObject({
      customer_code: 'CLI-001', customer_type: 'business', name: 'Cliente Uno',
      tax_id: 'ABC010101AB1', email: 'ventas@ejemplo.com', credit_limit: 1250.5,
      is_active: true,
    });
  });

  it.each([
    [{ name: ' ' }, 'El nombre del cliente es obligatorio.'],
    [{ customer_type: 'retail' }, 'Tipo de cliente inválido.'],
    [{ email: 'correo' }, 'El correo del cliente no es válido.'],
    [{ credit_limit: '-1' }, 'El límite de crédito no es válido.'],
    [{ is_active: 'activo' }, 'Estado de cliente inválido.'],
  ])('rechaza entradas inválidas', (values, message) => {
    expect(() => buildCustomerInsert(form(values), 'FALLBACK')).toThrow(message);
  });

  it('usa código generado cuando el campo está vacío y fecha explícita al editar', () => {
    expect(buildCustomerInsert(form({ customer_code: ' ' }), 'CLI-AUTO').customer_code).toBe('CLI-AUTO');
    expect(buildCustomerUpdate(form(), '2026-09-13T00:00:00.000Z').updated_at)
      .toBe('2026-09-13T00:00:00.000Z');
  });
});
