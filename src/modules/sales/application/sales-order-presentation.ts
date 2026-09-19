import type { SalesOrderStatus } from './sales-order-contract';

export type SalesOrderTone = 'neutral' | 'info' | 'success' | 'critical';

const STATUS_META: Record<SalesOrderStatus, { label: string; step: number; tone: SalesOrderTone }> = {
  draft: { label: 'Borrador', step: 1, tone: 'neutral' },
  confirmed: { label: 'Confirmado', step: 2, tone: 'info' },
  preparing: { label: 'En preparación', step: 3, tone: 'info' },
  ready: { label: 'Listo para entregar', step: 4, tone: 'success' },
  delivered: { label: 'Entregado', step: 5, tone: 'success' },
  cancelled: { label: 'Cancelado', step: 0, tone: 'critical' },
};

export function getSalesOrderStatusMeta(status: SalesOrderStatus) {
  return STATUS_META[status];
}

export function isDeliveryAtRisk(
  status: SalesOrderStatus,
  deliveryDate: string | null,
  now = new Date(),
): boolean {
  if (!deliveryDate || status === 'delivered' || status === 'cancelled') return false;
  return new Date(`${deliveryDate}T23:59:59.999Z`) < now;
}

const TIMELINE: Array<{ status: Exclude<SalesOrderStatus, 'cancelled'>; label: string }> = [
  { status: 'draft', label: 'Capturado' },
  { status: 'confirmed', label: 'Confirmado' },
  { status: 'preparing', label: 'Preparación' },
  { status: 'ready', label: 'Listo' },
  { status: 'delivered', label: 'Entregado' },
];

export function buildSalesOrderTimeline(status: SalesOrderStatus) {
  const currentStep = STATUS_META[status].step;
  return TIMELINE.map((item, index) => ({
    ...item,
    state: status === 'cancelled'
      ? 'pending' as const
      : index + 1 < currentStep
        ? 'complete' as const
        : index + 1 === currentStep
          ? 'current' as const
          : 'pending' as const,
  }));
}
