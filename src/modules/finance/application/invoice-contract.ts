export interface InvoiceIssueRequest {
  salesOrderId: string;
  dueDate: string | null;
  notes: string | null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const text = (form: FormData, field: string) => form.get(field)?.toString().trim() ?? '';

function isDate(value: string): boolean {
  const date = new Date(`${value}T00:00:00Z`);
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(date.valueOf())
    && date.toISOString().slice(0, 10) === value;
}

export function buildInvoiceIssueRequest(form: FormData, today: string): InvoiceIssueRequest {
  const salesOrderId = text(form, 'sales_order_id');
  const dueDate = text(form, 'due_date');
  if (!UUID.test(salesOrderId)) throw new Error('Identificador de pedido inválido.');
  if (dueDate && !isDate(dueDate)) throw new Error('Fecha de vencimiento inválida.');
  if (dueDate && dueDate < today) {
    throw new Error('El vencimiento no puede ser anterior a la emisión.');
  }
  return { salesOrderId, dueDate: dueDate || null, notes: text(form, 'notes') || null };
}
