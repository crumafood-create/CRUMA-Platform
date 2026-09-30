import { describe, expect, it } from 'vitest';

import type {
  TypedSupabaseClient,
} from '@/infrastructure/integrations/supabase/database.types';

import {
  completeProductionOutputToQuarantine,
} from './production-output-completion-repository';

const REQUEST = {
  productionOrderId:
    '11111111-1111-4111-8111-111111111111',
  producedQuantity: 87,
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
            'complete_production_output_quarantine',
            {
              p_idempotency_key:
                REQUEST.idempotencyKey,
              p_produced_quantity:
                REQUEST.producedQuantity,
              p_production_order_id:
                REQUEST.productionOrderId,
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