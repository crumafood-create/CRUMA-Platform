import { describe, expect, it } from 'vitest';

import {
  buildSalesOrderTimeline,
  getSalesOrderStatusMeta,
  isDeliveryAtRisk,
} from './sales-order-presentation';

describe('presentación y seguimiento de pedidos', () => {
  it('traduce el estado y comunica el avance', () => {
    expect(getSalesOrderStatusMeta('preparing')).toEqual({
      label: 'En preparación',
      step: 3,
      tone: 'info',
    });
  });

  it('marca como comprometida una entrega abierta vencida', () => {
    expect(isDeliveryAtRisk('confirmed', '2026-09-18', new Date('2026-09-19T12:00:00Z'))).toBe(true);
    expect(isDeliveryAtRisk('delivered', '2026-09-18', new Date('2026-09-19T12:00:00Z'))).toBe(false);
  });

  it('construye una línea de seguimiento estable para la orden', () => {
    expect(buildSalesOrderTimeline('ready').map((item) => item.state)).toEqual([
      'complete', 'complete', 'complete', 'current', 'pending',
    ]);
  });
});
