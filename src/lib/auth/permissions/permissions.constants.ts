export const PERMISSIONS = {
  CATALOG_PRODUCT_MANAGE: 'catalog.product.manage',
  IDENTITY_USER_MANAGE: 'identity.user.manage',
  PRODUCTION_ORDER_CREATE: 'production.order.create',
  PRODUCTION_ORDER_RELEASE: 'production.order.release',
  PRODUCTION_ORDER_START: 'production.order.start',
  PRODUCTION_ORDER_CANCEL: 'production.order.cancel',
  PRODUCTION_ORDER_COMPLETE: 'production.order.complete',
  SALES_ORDER_CREATE: 'sales.order.create',
  SALES_ORDER_CONFIRM: 'sales.order.confirm',
  SALES_ORDER_PREPARE: 'sales.order.prepare',
  SALES_ORDER_DELIVER: 'sales.order.deliver',
} as const;

export type Permission =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
