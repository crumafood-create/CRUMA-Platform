import { createClient }
from '@/infrastructure/supabase/server';

import { employeeDto }
from '../dto/employee.dto';

export async function getEmployees() {

  const supabase = await createClient();

  const { data, error } =
    await supabase

      .from('employees')

      .select(`
        id,
        full_name,
        email,
        role,
        department,
        salary,
        is_active,
        created_at
      `)

      .order('created_at', {
        ascending: false
      });

  if (error) {
    throw error;
  }

  return data.map(
    employeeDto
  );
}


