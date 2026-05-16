import { createClient }
from '@/infrastructure/supabase/server';

import { customerProfileDto }
from '../dto/customer-profile.dto';

export async function getCustomerProfiles() {

  const supabase = await createClient();

  const { data, error } =
    await supabase

      .from('customer_profiles')

      .select(`
        id,
        full_name,
        email,
        phone,
        loyalty_points,
        total_orders,
        lifetime_value
      `)

      .order('lifetime_value', {
        ascending: false
      });

  if (error) {
    throw error;
  }

  return data.map(
    customerProfileDto
  );
}
