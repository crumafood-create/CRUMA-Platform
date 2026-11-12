import { describe, expect, it } from 'vitest';

import type {
  TypedSupabaseClient,
} from '@/infrastructure/integrations/supabase/database.types';

import {
  createProductionOrderDraft,
  startProductionOrderWithMassSurplusReuse,
  disposeProductionMassSurplusAsWaste,
  startProductionOrderWithMassLotReservations,
  transitionProductionOrderLifecycle,
} from './production-order-lifecycle-repository';

const UUIDS = {
  recipe:
    'b1000000-0000-4000-8000-000000000001',
  order:
    'b2000000-0000-4000-8000-000000000001',
  idempotency:
    'b3000000-0000-4000-8000-000000000001',
} as const;

const CREATION_REQUEST = {
  recipeId: UUIDS.recipe,
  plannedQuantity: 100,
  notes: null,
  idempotencyKey: UUIDS.idempotency,
};

const TRANSITION_REQUEST = {
  productionOrderId: UUIDS.order,
  transition: 'cancel' as const,
  reason: 'Cambio de programa',
  idempotencyKey: UUIDS.idempotency,
};

describe(
  'repositorio del ciclo de vida de órdenes de producción',
  () => {
    it(
      'delega la creación completa a una RPC',
      async () => {
        const calls: unknown[] = [];

        const client = {
          rpc: async (
            ...args: unknown[]
          ) => {
            calls.push(args);

            return {
              data: UUIDS.order,
              error: null,
            };
          },
        } as unknown as TypedSupabaseClient;

        await expect(
          createProductionOrderDraft(
            client,
            CREATION_REQUEST,
          ),
        ).resolves.toBe(UUIDS.order);

        expect(calls).toEqual([
          [
            'create_production_order_draft',
            {
              p_idempotency_key:
                UUIDS.idempotency,
              p_notes: '',
              p_planned_quantity: 100,
              p_recipe_id:
                UUIDS.recipe,
            },
          ],
        ]);
      },
    );

    it(
      'propaga el error de creación',
      async () => {
        const client = {
          rpc: async () => ({
            data: null,
            error: {
              message:
                'Production recipe was not found.',
            },
          }),
        } as unknown as TypedSupabaseClient;

        await expect(
          createProductionOrderDraft(
            client,
            CREATION_REQUEST,
          ),
        ).rejects.toThrow(
          'Production recipe was not found.',
        );
      },
    );

    it(
      'rechaza una creación sin orden',
      async () => {
        const client = {
          rpc: async () => ({
            data: null,
            error: null,
          }),
        } as unknown as TypedSupabaseClient;

        await expect(
          createProductionOrderDraft(
            client,
            CREATION_REQUEST,
          ),
        ).rejects.toThrow(
          'La creación no devolvió una orden de producción.',
        );
      },
    );

    it(
      'delega la transición completa a una RPC',
      async () => {
        const calls: unknown[] = [];

        const client = {
          rpc: async (
            ...args: unknown[]
          ) => {
            calls.push(args);

            return {
              data: UUIDS.order,
              error: null,
            };
          },
        } as unknown as TypedSupabaseClient;

        await expect(
          transitionProductionOrderLifecycle(
            client,
            TRANSITION_REQUEST,
          ),
        ).resolves.toBe(UUIDS.order);

        expect(calls).toEqual([
          [
            'transition_production_order_lifecycle',
            {
              p_idempotency_key:
                UUIDS.idempotency,
              p_production_order_id:
                UUIDS.order,
              p_reason:
                'Cambio de programa',
              p_transition: 'cancel',
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
              data: UUIDS.order,
              error: null,
            };
          },
        } as unknown as TypedSupabaseClient;

        await transitionProductionOrderLifecycle(
          client,
          {
            ...TRANSITION_REQUEST,
            transition: 'release',
            reason: null,
          },
        );

        expect(calls).toEqual([
          [
            'transition_production_order_lifecycle',
            {
              p_idempotency_key:
                UUIDS.idempotency,
              p_production_order_id:
                UUIDS.order,
              p_reason: '',
              p_transition: 'release',
            },
          ],
        ]);
      },
    );

    it(
      'propaga el error de transición',
      async () => {
        const client = {
          rpc: async () => ({
            data: null,
            error: {
              message:
                'Production order transition is invalid.',
            },
          }),
        } as unknown as TypedSupabaseClient;

        await expect(
          transitionProductionOrderLifecycle(
            client,
            TRANSITION_REQUEST,
          ),
        ).rejects.toThrow(
          'Production order transition is invalid.',
        );
      },
    );

    it('envía los lotes pesados a la RPC atómica de inicio', async () => {
      const calls: unknown[] = [];
      const client = {
        rpc: async (...args: unknown[]) => {
          calls.push(args);
          return { data: UUIDS.order, error: null };
        },
      } as unknown as TypedSupabaseClient;

      await expect(
        startProductionOrderWithMassLotReservations(
          client,
          {
            productionOrderId: UUIDS.order,
            lotReservations: [
              { productLotId: 'c1000000-0000-4000-8000-000000000001', quantity: 0.6 },
              { productLotId: 'c1000000-0000-4000-8000-000000000002', quantity: 0.45 },
            ],
            idempotencyKey: UUIDS.idempotency,
          },
        ),
      ).resolves.toBe(UUIDS.order);

      expect(calls).toEqual([[
        'start_production_order_with_mass_lot_reservations',
        {
          p_production_order_id: UUIDS.order,
          p_lot_allocations: [
            { product_lot_id: 'c1000000-0000-4000-8000-000000000001', quantity: 0.6 },
            { product_lot_id: 'c1000000-0000-4000-8000-000000000002', quantity: 0.45 },
          ],
          p_idempotency_key: UUIDS.idempotency,
        },
      ]]);
    });

    it(
      'rechaza una transición sin orden',
      async () => {
        const client = {
          rpc: async () => ({
            data: null,
            error: null,
          }),
        } as unknown as TypedSupabaseClient;

        await expect(
          transitionProductionOrderLifecycle(
            client,
            TRANSITION_REQUEST,
          ),
        ).rejects.toThrow(
          'La transición no devolvió una orden de producción.',
        );
      },
    );
  },
);

describe('destino de sobrantes de masa', () => {
  it('delega la reutilización de sobrantes de la misma variedad a la RPC atómica', async () => {
    const calls: unknown[] = [];
    const client = {
      rpc: async (...args: unknown[]) => {
        calls.push(args);
        return { data: UUIDS.order, error: null };
      },
    } as unknown as TypedSupabaseClient;

    await expect(startProductionOrderWithMassSurplusReuse(client, {
      productionOrderId: UUIDS.order,
      reservationIds: ['c1000000-0000-4000-8000-000000000001'],
      idempotencyKey: UUIDS.idempotency,
    })).resolves.toBe(UUIDS.order);

    expect(calls).toEqual([[
      'start_production_order_with_mass_surplus_reuse',
      {
        p_production_order_id: UUIDS.order,
        p_reservation_ids: ['c1000000-0000-4000-8000-000000000001'],
        p_idempotency_key: UUIDS.idempotency,
      },
    ]]);
  });

  it('envía a merma solo el sobrante indicado y su motivo', async () => {
    const calls: unknown[] = [];
    const client = {
      rpc: async (...args: unknown[]) => {
        calls.push(args);
        return { data: UUIDS.order, error: null };
      },
    } as unknown as TypedSupabaseClient;

    await expect(disposeProductionMassSurplusAsWaste(
      client,
      'c1000000-0000-4000-8000-000000000002',
      'No reutilizable',
    )).resolves.toBe(UUIDS.order);

    expect(calls).toEqual([[
      'dispose_production_mass_surplus_as_waste',
      {
        p_reservation_id: 'c1000000-0000-4000-8000-000000000002',
        p_reason: 'No reutilizable',
      },
    ]]);
  });
});
