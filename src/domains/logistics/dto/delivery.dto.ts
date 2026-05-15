import type { Delivery }
from '../types/delivery.type';

export function deliveryDto(
  data: any
): Delivery {

  return {

    id: data.id,

    order_id:
      data.order_id,

    status:
      data.status,

    driver_name:
      data.driver_name,

    tracking_code:
      data.tracking_code,

    created_at:
      data.created_at
  };
}
