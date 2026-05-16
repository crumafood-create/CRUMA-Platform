import type { B2BCustomer }
from '../types/b2b-customer.type';

export function b2bCustomerDto(
  data: any
): B2BCustomer {

  return {

    id: data.id,

    company_name:
      data.company_name,

    contact_name:
      data.contact_name,

    email:
      data.email,

    pricing_tier:
      data.pricing_tier,

    credit_limit:
      data.credit_limit,

    is_active:
      data.is_active
  };
}
