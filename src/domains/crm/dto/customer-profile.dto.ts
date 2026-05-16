import type { CustomerProfile }
from '../types/customer-profile.type';

export function customerProfileDto(
  data: any
): CustomerProfile {

  return {

    id: data.id,

    full_name:
      data.full_name,

    email:
      data.email,

    phone:
      data.phone,

    loyalty_points:
      data.loyalty_points,

    total_orders:
      data.total_orders,

    lifetime_value:
      data.lifetime_value
  };
}
