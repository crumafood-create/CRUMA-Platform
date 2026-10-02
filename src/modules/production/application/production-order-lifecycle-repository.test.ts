import { describe, expect, it } from 'vitest';

import type {
  TypedSupabaseClient,
} from '@/infrastructure/integrations/supabase/database.types';

import {
  createProductionOrderDraft,
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
