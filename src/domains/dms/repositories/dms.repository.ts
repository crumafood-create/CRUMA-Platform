import { createClient }
from '@/infrastructure/supabase/server';

import { documentDto }
from '../dto/document.dto';

export async function getDocuments() {

  const supabase = await createClient();

  const { data, error } =
    await supabase

      .from('documents')

      .select(`
        id,
        title,
        category,
        file_path,
        mime_type,
        uploaded_by,
        created_at
      `)

      .order('created_at', {
        ascending: false
      });

  if (error) {
    throw error;
  }

  return data.map(
    documentDto
  );
}

