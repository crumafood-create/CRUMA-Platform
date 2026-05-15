import type { Order }
from '../types/order.type';

export function orderDto(
  data: any
): Order {

  return {

    id: data.id,

    status: data.status,

    payment_status:
      data.payment_status,

    total_amount:
      data.total_amount,

    created_at:
      data.created_at,

    full_name:
      data.full_name,

    phone:
      data.phone
  };
}
