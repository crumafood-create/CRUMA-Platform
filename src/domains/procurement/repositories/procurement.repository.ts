import { createClient }
from '@/infrastructure/supabase/server';

import { supplierDto }
from '../dto/supplier.dto';

export async function getSuppliers() {

  const supabase = await createClient();

  const { data, error } =
    await supabase

      .from('suppliers')

      .select(`
        id,
        company_name,
        contact_name,
        email,
        phone,
        is_active,
        created_at
      `)

      .order('company_name');

  if (error) {
    throw error;
  }

  return data.map(
    supplierDto
  );
}
