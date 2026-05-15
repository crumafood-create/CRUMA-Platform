import type { AiSearchResult }
from '../types/ai-search-result.type';

export function aiSearchDto(
  data: any
): AiSearchResult {

  return {

    id: data.id,

    name: data.name,

    slug: data.slug,

    description:
      data.description,

    similarity:
      data.similarity
  };
}
