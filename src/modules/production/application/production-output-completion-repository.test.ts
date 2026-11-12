import { describe, expect, it } from 'vitest';

import type {
  TypedSupabaseClient,
} from '@/infrastructure/integrations/supabase/database.types';

import {
  completeProductionOutputToQuarantine,
  completeProductionOrderWithMassOutput,
  completeProductionOutputWithMassLotYield,
} from './production-output-completion-repository';

const REQUEST = {
  productionOrderId:
    '11111111-1111-4111-8111-111111111111',
  producedQuantity: 87,
  wasteQuantity: 13,
  varianceReason: 'Merma por recorte',
  idempotencyKey:
    '33333333-3333-4333-8333-333333333333',
};

describe(
  'repositorio de cierre de producción',
  () => {
    it(
      'delega el cierre completo a una RPC',
      async () => {
        const calls: unknown[] = [];

        const client = {
          rpc: async (
            ...args: unknown[]
          ) => {
            calls.push(args);

            return {
              data:
                '44444444-4444-4444-8444-444444444444',
              error: null,
            };
          },
        } as unknown as TypedSupabaseClient;

        await expect(
          completeProductionOutputToQuarantine(
            client,
            REQUEST,
          ),
        ).resolves.toBe(
          '44444444-4444-4444-8444-444444444444',
        );

        expect(calls).toEqual([
          [
            'complete_production_yield_to_quarantine',
            {
              p_idempotency_key:
                REQUEST.idempotencyKey,
              p_produced_quantity:
                REQUEST.producedQuantity,
              p_production_order_id:
                REQUEST.productionOrderId,
              p_variance_reason:
                REQUEST.varianceReason,
              p_waste_quantity:
                REQUEST.wasteQuantity,
            },
          ],
        ]);
      },
    );

    it(
      'normaliza un motivo ausente para la RPC',
      async () => {
        const calls: unknown[] = [];

        const client = {
          rpc: async (
            ...args: unknown[]
          ) => {
            calls.push(args);

            return {
              data:
                '44444444-4444-4444-8444-444444444444',
              error: null,
            };
          },
        } as unknown as TypedSupabaseClient;

        await completeProductionOutputToQuarantine(
          client,
          {
            ...REQUEST,
            wasteQuantity: 0,
            varianceReason: null,
          },
        );

        expect(calls).toEqual([
          [
            'complete_production_yield_to_quarantine',
            {
              p_idempotency_key:
                REQUEST.idempotencyKey,
              p_produced_quantity:
                REQUEST.producedQuantity,
              p_production_order_id:
                REQUEST.productionOrderId,
              p_variance_reason: '',
              p_waste_quantity: 0,
            },
          ],
        ]);
      },
    );

    it(
      'propaga el error transaccional',
      async () => {
        const client = {
          rpc: async () => ({
            data: null,
            error: {
              message:
                'All production materials must be consumed.',
            },
          }),
        } as unknown as TypedSupabaseClient;

        await expect(
          completeProductionOutputToQuarantine(
            client,
            REQUEST,
          ),
        ).rejects.toThrow(
          'All production materials must be consumed.',
        );
      },
    );

    it(
      'rechaza una respuesta sin salida',
      async () => {
        const client = {
          rpc: async () => ({
            data: null,
            error: null,
          }),
        } as unknown as TypedSupabaseClient;

        await expect(
          completeProductionOutputToQuarantine(
            client,
            REQUEST,
          ),
        ).rejects.toThrow(
          'El cierre no devolvió una salida de producción.',
        );
      },
    );
  },
);

describe('cierre de masa por lote', () => {
  it('envía las piezas reales y el sobrante por cada lote a la RPC atómica', async () => {
    const calls: unknown[] = [];
    const client = {
      rpc: async (...args: unknown[]) => {
        calls.push(args);
        return { data: '44444444-4444-4444-8444-444444444444', error: null };
      },
    } as unknown as TypedSupabaseClient;

    await expect(completeProductionOutputWithMassLotYield(client, {
      ...REQUEST,
      producedQuantity: 48,
      wasteQuantity: 2,
      varianceReason: 'Variación de rendimiento',
      lotSurpluses: [
        { productLotId: '55555555-5555-4555-8555-555555555555', surplusQuantity: 0.1 },
        { productLotId: '66666666-6666-4666-8666-666666666666', surplusQuantity: 0.05 },
      ],
    })).resolves.toBe('44444444-4444-4444-8444-444444444444');

    expect(calls).toEqual([[
      'complete_production_order_with_mass_lot_yield',
      {
        p_idempotency_key: REQUEST.idempotencyKey,
        p_lot_surpluses: [
          { product_lot_id: '55555555-5555-4555-8555-555555555555', surplus_quantity: 0.1 },
          { product_lot_id: '66666666-6666-4666-8666-666666666666', surplus_quantity: 0.05 },
        ],
        p_produced_quantity: 48,
        p_production_order_id: REQUEST.productionOrderId,
        p_variance_reason: 'Variación de rendimiento',
        p_waste_quantity: 2,
      },
    ]]);
  });
});

describe('cierre de preparación intermedia de masa', () => {
  it('envía el peso real en kg a la RPC atómica de finalización', async () => {
    const calls: unknown[] = [];
    const client = {
      rpc: async (...args: unknown[]) => {
        calls.push(args);
        return { data: '77777777-7777-4777-8777-777777777777', error: null };
      },
    } as unknown as TypedSupabaseClient;

    await expect(completeProductionOrderWithMassOutput(client, {
      productionOrderId: REQUEST.productionOrderId,
      actualMassQuantity: 2.15,
      idempotencyKey: REQUEST.idempotencyKey,
    })).resolves.toBe('77777777-7777-4777-8777-777777777777');

    expect(calls).toEqual([[
      'complete_production_order_with_mass_output',
      {
        p_production_order_id: REQUEST.productionOrderId,
        p_actual_mass_quantity: 2.15,
        p_idempotency_key: REQUEST.idempotencyKey,
      },
    ]]);
  });
});
