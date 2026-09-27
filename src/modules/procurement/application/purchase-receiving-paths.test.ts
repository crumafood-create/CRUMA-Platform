import { readFileSync } from 'node:fs';

import {
  describe,
  expect,
  it,
} from 'vitest';

function source(path: string): string {
  return readFileSync(
    new URL(path, import.meta.url),
    'utf8',
  );
}

function normalizeSource(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .trim();
}

const MOBILE_ACTION =
  '../../../app/mobile/receiving/[id]/actions.ts';

const MOBILE_CLIENT =
  '../../../app/mobile/receiving/[id]/receiving-detail-client.tsx';

const ADMIN_ORDER_PAGE =
  '../../../app/(admin)/purchase-orders/[id]/page.tsx';

const LEGACY_MOBILE_ACTION =
  '../../../app/mobile/receiving/action.ts';

const RECEIVING_SERVICE =
  '../../warehouse/services/receiving.service.ts';

describe('rutas seguras de recepción de compras', () => {
  it('envía el contrato completo e idempotente al RPC', () => {
    const action = normalizeSource(
      source(MOBILE_ACTION),
    );

    const client = normalizeSource(
      source(MOBILE_CLIENT),
    );

    expect(action).toContain(
      'p_quantity: input.quantityReceived',
    );

    expect(action).toContain(
      'p_idempotency_key: input.idempotencyKey',
    );

    expect(client).toContain(
      'crypto.randomUUID()',
    );

    expect(client).toContain(
      'Cantidad a recibir',
    );

    expect(client).toContain(
      'type="number"',
    );
  });

  it('dirige la recepción administrativa al flujo trazable', () => {
    const page = normalizeSource(
      source(ADMIN_ORDER_PAGE),
    );

    expect(page).toContain(
      '/mobile/receiving/${order.id}',
    );

    expect(page).not.toContain(
      'receivePurchaseOrder',
    );

    expect(page).not.toContain(
      'Recibir pendiente',
    );
  });

  it('elimina la escritura heredada no atómica', () => {
    const service = normalizeSource(
      source(RECEIVING_SERVICE),
    );

    const legacyAction = normalizeSource(
      source(LEGACY_MOBILE_ACTION),
    );

    expect(service).not.toContain(
      'processReceivingItem',
    );

    expect(service).not.toContain(
      'incrementReceivedQuantity',
    );

    expect(service).not.toContain(
      ".from('raw_material_lots').insert(",
    );

    expect(legacyAction).not.toContain(
      'processReceivingItem',
    );
  });
});