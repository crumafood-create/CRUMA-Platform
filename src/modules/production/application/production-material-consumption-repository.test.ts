import { describe, expect, it } from 'vitest';

import type {
  TypedSupabaseClient,
} from '@/infrastructure/integrations/supabase/database.types';

import {
  consumeProductionMaterialFefo,
} from './production-material-consumption-repository';

const REQUEST = {
  productionOrderItemId:
    '11111111-1111-4111-8111-111111111111',
  scannedLotNumber: 'MP-LOTE-001',
  idempotencyKey:
    '22222222-2222-4222-8222-222222222222',
};

describe('repositorio de consumo de materia prima', () => {
  it('delega el consumo FEFO completo a una RPC', async () => {
    const calls: unknown[] = [];

    const client = {
      rpc: async (...args: unknown[]) => {
        calls.push(args);

        return {
          data:
            '33333333-3333-4333-8333-333333333333',
          error: null,
        };
      },
    } as unknown as TypedSupabaseClient;

    await expect(
      consumeProductionMaterialFefo(
        client,
        REQUEST,
      ),
    ).resolves.toBe(
      '33333333-3333-4333-8333-333333333333',
    );

    expect(calls).toEqual([
      [
        'consume_production_material_fefo',
        {
          p_idempotency_key:
            REQUEST.idempotencyKey,
          p_production_order_item_id:
            REQUEST.productionOrderItemId,
          p_scanned_lot_number:
            REQUEST.scannedLotNumber,
        },
      ],
    ]);
  });

  it('propaga el error devuelto por la RPC', async () => {
    const client = {
      rpc: async () => ({
        data: null,
        error: {
          message:
            'Insufficient available raw material stock.',
        },
      }),
    } as unknown as TypedSupabaseClient;

    await expect(
      consumeProductionMaterialFefo(
        client,
        REQUEST,
      ),
    ).rejects.toThrow(
      'Insufficient available raw material stock.',
    );
  });

  it('rechaza una respuesta sin identificador', async () => {
    const client = {
      rpc: async () => ({
        data: null,
        error: null,
      }),
    } as unknown as TypedSupabaseClient;

    await expect(
      consumeProductionMaterialFefo(
        client,
        REQUEST,
      ),
    ).rejects.toThrow(
      'El consumo no devolvió una orden de producción.',
    );
  });
});