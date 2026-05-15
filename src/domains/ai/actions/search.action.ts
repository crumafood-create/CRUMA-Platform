'use server';

import { semanticSearch }
from '../services/ai.service';

export async function searchAction(
  formData: FormData
) {

  const query =
    formData.get('query') as string;

  if (!query) {
    return [];
  }

  return semanticSearch(query);
}
