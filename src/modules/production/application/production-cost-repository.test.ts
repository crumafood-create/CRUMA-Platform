import { describe, expect, it } from 'vitest';

import type {
  TypedSupabaseClient,
} from '@/infrastructure/integrations/supabase/database.types';

import {
  calculateProductionCost,
} from './production-cost-repository';

const REQUEST = {
  productionOrderId:
    'c6000000-0000-4000-8000-000000000001',
  laborCost: 20,
  overheadCost: 5,
  idempotencyKey:
    'c8000000-0000-4000-8000-000000000001',
};

describe(
  'repositorio de cierre de costos de producción',
  () => {
    it(
      'delega el cierre completo a una RPC idempotente',
      async () => {
        const calls: unknown[] = [];

        const client = {
          rpc: async (
            ...args: unknown[]
          ) => {
            calls.push(args);

            return {
              data:
                'c9000000-0000-4000-8000-000000000001',
              error: null,
            };
          },
        } as unknown as TypedSupabaseClient;

        await expect(
          calculateProductionCost(
            client,
            REQUEST,
          ),
        ).resolves.toBe(
          'c9000000-0000-4000-8000-000000000001',
        );

        expect(calls).toEqual([
          [
            'settle_production_cost',
            {
              p_idempotency_key:
                REQUEST.idempotencyKey,
              p_labor_cost:
                REQUEST.laborCost,
              p_overhead_cost:
                REQUEST.overheadCost,
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
                'Production order must be completed.',
            },
          }),
        } as unknown as TypedSupabaseClient;

        await expect(
          calculateProductionCost(
            client,
            REQUEST,
          ),
        ).rejects.toThrow(
          'Production order must be completed.',
        );
      },
    );

    it(
      'rechaza una respuesta sin costo',
      async () => {
        const client = {
          rpc: async () => ({
            data: null,
            error: null,
          }),
        } as unknown as TypedSupabaseClient;

        await expect(
          calculateProductionCost(
            client,
            REQUEST,
          ),
        ).rejects.toThrow(
          'La base de datos no devolvió el costo calculado.',
        );
      },
    );
  },
);
