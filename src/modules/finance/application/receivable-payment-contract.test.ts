import { describe, expect, it } from 'vitest';
import { buildReceivablePayment } from './receivable-payment-contract';

function payment(overrides: Record<string, string> = {}): FormData {
  const form = new FormData();
  const values = {
    account_receivable_id: '9d000000-0000-0000-0000-000000000001',
    payment_date: '2026-09-13', amount: '125.50', payment_method: 'transfer',
    reference: ' SPEI-123 ', notes: ' Pago parcial ', ...overrides,
  };
  Object.entries(values).forEach(([key, value]) => form.set(key, value));
  return form;
}

describe('contrato de abonos por cobrar', () => {
  it('normaliza un abono válido', () => {
    expect(buildReceivablePayment(payment(), '2026-09-13')).toEqual({
      accountId: '9d000000-0000-0000-0000-000000000001', paymentDate: '2026-09-13',
      amount: 125.5, paymentMethod: 'transfer', reference: 'SPEI-123', notes: 'Pago parcial',
    });
  });

  it.each([
    [{ account_receivable_id: 'x' }, 'Identificador de cuenta inválido.'],
    [{ amount: '0' }, 'El monto del pago debe ser mayor que cero.'],
    [{ amount: 'NaN' }, 'El monto del pago debe ser mayor que cero.'],
    [{ payment_date: '2026-02-30' }, 'Fecha de pago inválida.'],
    [{ payment_date: '2026-09-14' }, 'La fecha de pago no puede estar en el futuro.'],
    [{ payment_method: 'crypto' }, 'Método de pago inválido.'],
    [{ reference: ' ' }, 'La referencia del pago es obligatoria.'],
  ])('rechaza datos inválidos', (values, message) => {
    expect(() => buildReceivablePayment(payment(values), '2026-09-13')).toThrow(message);
  });
});
