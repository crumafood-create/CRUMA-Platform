export interface Invoice {

  id: string;

  invoice_number: string;

  customer_name: string | null;

  total_amount: number;

  status: string;

  due_date: string | null;

  created_at: string;
}


