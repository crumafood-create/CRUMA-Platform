import type { Tenant }
from '../types/tenant.type';

export function tenantDto(
  data: any
): Tenant {

  return {

    id: data.id,

    name: data.name,

    slug: data.slug,

    is_active:
      data.is_active,

    created_at:
      data.created_at
  };
}
