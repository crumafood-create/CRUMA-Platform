export interface InventoryLevel {

  id: string;

  product_id: string;

  warehouse_id: string;

  available_quantity: number;

  reserved_quantity: number;

  updated_at: string;
}
