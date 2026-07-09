// ============================================================================
// PRODUCTION STATUS
// ============================================================================

export const PRODUCTION_STATUS = {
  DRAFT: 'draft',
  RELEASED: 'released',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type ProductionStatus =
  (typeof PRODUCTION_STATUS)[keyof typeof PRODUCTION_STATUS];

// ============================================================================
// ITEM STATUS
// ============================================================================

export const PRODUCTION_ITEM_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;

export type ProductionItemStatus =
  (typeof PRODUCTION_ITEM_STATUS)[keyof typeof PRODUCTION_ITEM_STATUS];

// ============================================================================
// INVENTORY MOVEMENTS
// ============================================================================

export const INVENTORY_MOVEMENT = {
  ENTRY: 'entry',
  EXIT: 'exit',
  ADJUSTMENT: 'adjustment',
  TRANSFER: 'transfer',
} as const;

export type InventoryMovementType =
  (typeof INVENTORY_MOVEMENT)[keyof typeof INVENTORY_MOVEMENT];

// ============================================================================
// REFERENCE TYPES
// ============================================================================

export const INVENTORY_REFERENCE = {
  PURCHASE_ORDER: 'purchase_order',
  PRODUCTION_ORDER: 'production_order',
  PICKING_ORDER: 'picking_order',
  SALES_ORDER: 'sales_order',
  INVENTORY_ADJUSTMENT: 'inventory_adjustment',
} as const;

// ============================================================================
// LOT PREFIXES
// ============================================================================

export const LOT_PREFIX = {
  RAW_MATERIAL: 'MP',
  FINISHED_PRODUCT: 'PT',
} as const;

// ============================================================================
// DEFAULTS
// ============================================================================

export const DEFAULT_EXPIRATION_DAYS = 365;
