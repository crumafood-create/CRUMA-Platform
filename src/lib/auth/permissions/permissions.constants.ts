export const PERMISSIONS = {
  CATALOG_PRODUCT_MANAGE: 'catalog.product.manage',
  IDENTITY_USER_MANAGE: 'identity.user.manage',
  INVENTORY_MATERIAL_MANAGE: 'inventory.material.manage',
  INVENTORY_LOCATION_MANAGE: 'inventory.location.manage',
  INVENTORY_UNIT_MANAGE: 'inventory.unit.manage',
  INVENTORY_WAREHOUSE_MANAGE: 'inventory.warehouse.manage',
  INVENTORY_MOVEMENT_CREATE: 'inventory.movement.create',
  INVENTORY_ADJUSTMENT_CREATE: 'inventory.adjustment.create',
  PROCUREMENT_SUPPLIER_MANAGE: 'procurement.supplier.manage',
  PROCUREMENT_ORDER_MANAGE: 'procurement.order.manage',
  PROCUREMENT_ORDER_RECEIVE: 'procurement.order.receive',
  PRODUCTION_RECIPE_MANAGE: 'production.recipe.manage',
  PRODUCTION_ORDER_CREATE: 'production.order.create',
  PRODUCTION_ORDER_RELEASE: 'production.order.release',
  PRODUCTION_ORDER_START: 'production.order.start',
  PRODUCTION_ORDER_CANCEL: 'production.order.cancel',
  PRODUCTION_ORDER_COMPLETE: 'production.order.complete',
  SALES_ORDER_CREATE: 'sales.order.create',
  SALES_ORDER_CONFIRM: 'sales.order.confirm',
  SALES_ORDER_PREPARE: 'sales.order.prepare',
  SALES_ORDER_DELIVER: 'sales.order.deliver',
  SALES_ORDER_PROFIT_CALCULATE: 'sales.order.profit.calculate',
} as const;

export type Permission =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
