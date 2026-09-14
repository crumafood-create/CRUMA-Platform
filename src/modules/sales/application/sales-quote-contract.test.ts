import { describe, expect, it } from 'vitest';

import {
  assertSalesQuoteTransition,
  buildSalesQuoteCreateRequest,
  buildSalesQuoteItemRequest,
} from './sales-quote-contract';

const CUSTOMER = 'a1000000-0000-0000-0000-000000000001';
const QUOTE = 'a2000000-0000-0000-0000-000000000001';
const PRODUCT = 'a3000000-0000-0000-0000-000000000001';

function form(values: Record<string, string>): FormData {
  const result = new FormData();
  Object.entries(values).forEach(([key, value]) => result.set(key, value));
  return result;
}

describe('contrato de cotizaciones', () => {
  it('normaliza una nueva cotización', () => {
    expect(buildSalesQuoteCreateRequest(form({
      customer_id: CUSTOMER, valid_until: '2026-09-30', notes: ' Cliente nuevo ', terms: ' Pago anticipado ',
    }), '2026-09-13')).toEqual({
      customerId: CUSTOMER, validUntil: '2026-09-30', notes: 'Cliente nuevo', terms: 'Pago anticipado',
    });
  });

  it('calcula una partida con descuento e impuesto', () => {
    expect(buildSalesQuoteItemRequest(form({
      quote_id: QUOTE, product_id: PRODUCT, quantity: '2', unit_price: '50', discount: '5', tax_rate: '16',
    }))).toEqual({
      quoteId: QUOTE, productId: PRODUCT, quantity: 2, unitPrice: 50, discount: 5, taxRate: 16,
      subtotal: 100, taxAmount: 15.2, total: 110.2,
    });
  });

  it.each([
    [{ customer_id: 'x', valid_until: '2026-09-30' }, 'Identificador de cliente inválido.'],
    [{ customer_id: CUSTOMER, valid_until: '2026-02-30' }, 'Vigencia inválida.'],
    [{ customer_id: CUSTOMER, valid_until: '2026-09-12' }, 'La vigencia no puede ser anterior a la emisión.'],
  ])('rechaza cabeceras inválidas', (values, message) => {
    expect(() => buildSalesQuoteCreateRequest(form(values), '2026-09-13')).toThrow(message);
  });

  it.each([
    [{ quote_id: QUOTE, product_id: PRODUCT, quantity: '0', unit_price: '50', discount: '0', tax_rate: '16' }, 'Cantidad inválida.'],
    [{ quote_id: QUOTE, product_id: PRODUCT, quantity: '1', unit_price: '50', discount: '51', tax_rate: '16' }, 'Descuento inválido.'],
    [{ quote_id: QUOTE, product_id: PRODUCT, quantity: '1', unit_price: '50', discount: '0', tax_rate: '101' }, 'Impuesto inválido.'],
  ])('rechaza partidas inválidas', (values, message) => {
    expect(() => buildSalesQuoteItemRequest(form(values))).toThrow(message);
  });

  it('acepta únicamente transiciones explícitas', () => {
    expect(assertSalesQuoteTransition('draft', 'sent')).toBe('sent');
    expect(assertSalesQuoteTransition('sent', 'accepted')).toBe('accepted');
    expect(() => assertSalesQuoteTransition('draft', 'accepted')).toThrow('Transición de cotización inválida.');
    expect(() => assertSalesQuoteTransition('converted', 'cancelled')).toThrow('Transición de cotización inválida.');
  });
});
