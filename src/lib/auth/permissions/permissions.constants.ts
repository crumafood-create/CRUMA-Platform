export const PERMISSIONS = {
  CATALOG_PRODUCT_MANAGE: 'catalog.product.manage',
  IDENTITY_USER_MANAGE: 'identity.user.manage',
  PRODUCTION_ORDER_CREATE: 'production.order.create',
  SALES_ORDER_DELIVER: 'sales.order.deliver',
} as const;

export type Permission =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
