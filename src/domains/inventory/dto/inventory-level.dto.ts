import type { InventoryLevel }
from '../types/inventory-level.type';

export function inventoryLevelDto(
  data: any
): InventoryLevel {

  return {

    id: data.id,

    product_id: data.product_id,

    warehouse_id:
      data.warehouse_id,

    available_quantity:
      data.available_quantity,

    reserved_quantity:
      data.reserved_quantity,

    updated_at:
      data.updated_at
  };
}
