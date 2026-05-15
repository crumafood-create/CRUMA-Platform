export interface Order {

  id: string;

  status: string;

  payment_status: string;

  total_amount: number | null;

  created_at: string;

  full_name: string | null;

  phone: string | null;
}
