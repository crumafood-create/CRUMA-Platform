import type { Invoice }
from '../types/invoice.type';

export function invoiceDto(
  data: any
): Invoice {

  return {

    id: data.id,

    invoice_number:
      data.invoice_number,

    customer_name:
      data.customer_name,

    total_amount:
      data.total_amount,

    status:
      data.status,

    due_date:
      data.due_date,

    created_at:
      data.created_at
  };
}


