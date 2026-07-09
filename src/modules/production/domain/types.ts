// ============================================================================
// PRODUCTION STATUS
// ============================================================================

export type ProductionOrderStatus =
  | 'draft'
  | 'released'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

// ============================================================================
// PRODUCTION ORDER
// ============================================================================

export interface ProductionOrder {
  id: string;
  order_number: string;
  recipe_id: string;

  planned_quantity: number;
  produced_quantity: number;

  status: ProductionOrderStatus;

  created_at: string;

  updated_at: string | null;

  started_at: string | null;

  completed_at: string | null;
}

// ============================================================================
// PRODUCTION ITEM
// ============================================================================

export interface ProductionOrderItem {
  id: string;

  production_order_id: string;

  raw_material_id: string;

  planned_quantity: number;

  consumed_quantity: number;

  status: string;
}

// ============================================================================
// RAW MATERIAL LOT
// ============================================================================

export interface RawMaterialLot {
  id: string;

  raw_material_id: string;

  lot_number: string;

  quantity: number;

  expiration_date: string | null;

  created_at: string;
}

// ============================================================================
// FEFO RESULT
// ============================================================================

export interface FEFOAllocation {
  lot_id: string;

  lot_number: string;

  quantity: number;

  remaining_quantity: number;
}

// ============================================================================
// INVENTORY MOVEMENT
// ============================================================================

export interface InventoryMovementInput {
  item_type: 'raw_material' | 'product';

  item_id: string;

  movement_type:
    | 'entry'
    | 'exit'
    | 'adjustment'
    | 'transfer';

  quantity: number;

  reference_type: string;

  reference_id: string;

  notes?: string | null;
}

// ============================================================================
// FINISHED LOT
// ============================================================================

export interface FinishedProductLot {
  id: string;

  product_id: string;

  lot_number: string;

  quantity: number;

  expiration_date: string | null;
}
