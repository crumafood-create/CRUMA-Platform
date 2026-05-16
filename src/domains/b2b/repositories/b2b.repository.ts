import { createClient }
from '@/infrastructure/supabase/server';

import { b2bCustomerDto }
from '../dto/b2b-customer.dto';

export async function getB2BCustomers() {

  const supabase = await createClient();

  const { data, error } =
    await supabase

      .from('b2b_customers')

      .select(`
        id,
        company_name,
        contact_name,
        email,
        pricing_tier,
        credit_limit,
        is_active
      `)

      .order('company_name');

  if (error) {
    throw error;
  }

  return data.map(
    b2bCustomerDto
  );
}
