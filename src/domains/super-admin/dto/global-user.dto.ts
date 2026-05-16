import type { GlobalUser }
from '../types/global-user.type';

export function globalUserDto(
  data: any
): GlobalUser {

  return {

    id: data.id,

    full_name:
      data.full_name,

    email:
      data.email,

    role:
      data.role,

    tenant_id:
      data.tenant_id,

    is_active:
      data.is_active
  };
}
