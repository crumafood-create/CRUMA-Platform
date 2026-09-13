import { describe, expect, it } from 'vitest';

import { buildInvoiceIssueRequest } from './invoice-contract';

function issueForm(overrides: Record<string, string> = {}): FormData {
  const form = new FormData();
  const values = {
    sales_order_id: '9d000000-0000-0000-0000-000000000001',
    due_date: '2026-09-30',
    notes: ' Entrega completa ',
    ...overrides,
  };
  Object.entries(values).forEach(([key, value]) => form.set(key, value));
  return form;
}

describe('contrato de emisión de facturas comerciales', () => {
  it('normaliza una solicitud válida', () => {
    expect(buildInvoiceIssueRequest(issueForm(), '2026-09-13')).toEqual({
      salesOrderId: '9d000000-0000-0000-0000-000000000001',
      dueDate: '2026-09-30',
      notes: 'Entrega completa',
    });
  });

  it('permite omitir vencimiento y notas', () => {
    expect(buildInvoiceIssueRequest(issueForm({ due_date: '', notes: '' }), '2026-09-13'))
      .toEqual({
        salesOrderId: '9d000000-0000-0000-0000-000000000001',
        dueDate: null,
        notes: null,
      });
  });

  it.each([
    [{ sales_order_id: 'pedido-1' }, 'Identificador de pedido inválido.'],
    [{ due_date: '2026-02-30' }, 'Fecha de vencimiento inválida.'],
    [{ due_date: '2026-09-12' }, 'El vencimiento no puede ser anterior a la emisión.'],
  ])('rechaza datos inválidos', (values, message) => {
    expect(() => buildInvoiceIssueRequest(issueForm(values), '2026-09-13')).toThrow(message);
  });
});
