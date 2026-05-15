import type { ProductionOrder }
from '../types/production-order.type';

export function productionOrderDto(
  data: any
): ProductionOrder {

  return {

    id: data.id,

    order_number:
      data.order_number,

    status: data.status,

    planned_quantity:
      data.planned_quantity,

    produced_quantity:
      data.produced_quantity,

    created_at:
      data.created_at
  };
}
