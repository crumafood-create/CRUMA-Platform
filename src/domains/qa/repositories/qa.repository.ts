import { createClient }
from '@/infrastructure/supabase/server';

import { qaInspectionDto }
from '../dto/qa-inspection.dto';

export async function getQAInspections() {

  const supabase = await createClient();

  const { data, error } =
    await supabase

      .from('qa_inspections')

      .select(`
        id,
        batch_code,
        status,
        inspector_name,
        notes,
        created_at
      `)

      .order('created_at', {
        ascending: false
      });

  if (error) {
    throw error;
  }

  return data.map(
    qaInspectionDto
  );
}
