import 'server-only';

import { createClient }
from '@/infrastructure/supabase/server';

import { aiSearchDto }
from '../dto/ai-search.dto';

export async function searchProductsSemantic(
  query: string
) {

  const supabase = await createClient();

  const { data, error } =
    await supabase.rpc(

      'search_products_semantic',

      {
        search_query: query
      }
    );

  if (error) {
    throw error;
  }

  return data.map(aiSearchDto);
}
