import { createClient }
from '@/infrastructure/supabase/server';

import { invoiceDto }
from '../dto/invoice.dto';

export async function getInvoices() {

  const supabase = await createClient();

  const { data, error } =
    await supabase

      .from('invoices')

      .select(`
        id,
        invoice_number,
        customer_name,
        total_amount,
        status,
        due_date,
        created_at
      `)

      .order('created_at', {
        ascending: false
      });

  if (error) {
    throw error;
  }

  return data.map(
    invoiceDto
  );
}


