import type { Supplier }
from '../types/supplier.type';

export function supplierDto(
  data: any
): Supplier {

  return {

    id: data.id,

    company_name:
      data.company_name,

    contact_name:
      data.contact_name,

    email:
      data.email,

    phone:
      data.phone,

    is_active:
      data.is_active,

    created_at:
      data.created_at
  };
}
