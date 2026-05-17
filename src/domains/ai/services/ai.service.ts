import 'server-only';

import { searchProductsSemantic }
from '../repositories/ai.repository';

export async function semanticSearch(
  query: string
) {

  return searchProductsSemantic(
    query
  );
}
