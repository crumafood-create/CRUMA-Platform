import { describe, expect, it } from 'vitest';

import type {
  TypedSupabaseClient,
} from '@/infrastructure/integrations/supabase/database.types';

import type {
  FinishedProductNonconformanceDispositionRequest,
} from './finished-product-nonconformance-disposition-contract';
import {
  disposeFinishedProductNonconformance,
} from './finished-product-nonconformance-disposition-repository';

const REQUEST = {
  qualityInspectionId:
    'a1000000-0000-4000-8000-000000000001',
  disposition: 'rework',
  reason: 'Reprocesar el lote completo',
  idempotencyKey:
    'a2000000-0000-4000-8000-000000000001',
} satisfies
  FinishedProductNonconformanceDispositionRequest;

describe(
  'repositorio de disposición de producto no conforme',
  () => {
    it(
      'delega toda la disposición a una RPC atómica',
      async () => {
        const calls: unknown[] = [];

        const client = {
          rpc: async (
            ...args: unknown[]
          ) => {
            calls.push(args);

            return {
              data:
                'a3000000-0000-4000-8000-000000000001',
              error: null,
            };
          },
        } as unknown as TypedSupabaseClient;

        await expect(
          disposeFinishedProductNonconformance(
            client,
            REQUEST,
          ),
        ).resolves.toBe(
          'a3000000-0000-4000-8000-000000000001',
        );

        expect(calls).toEqual([
          [
            'dispose_finished_product_nonconformance',
            {
              p_disposition:
                REQUEST.disposition,
              p_idempotency_key:
                REQUEST.idempotencyKey,
              p_inspection_id:
                REQUEST.qualityInspectionId,
              p_reason:
                REQUEST.reason,
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
                'Quality inspection already has a decision.',
            },
          }),
        } as unknown as TypedSupabaseClient;

        await expect(
          disposeFinishedProductNonconformance(
            client,
            REQUEST,
          ),
        ).rejects.toThrow(
          'Quality inspection already has a decision.',
        );
      },
    );

    it(
      'rechaza una respuesta sin operación',
      async () => {
        const client = {
          rpc: async () => ({
            data: null,
            error: null,
          }),
        } as unknown as TypedSupabaseClient;

        await expect(
          disposeFinishedProductNonconformance(
            client,
            REQUEST,
          ),
        ).rejects.toThrow(
          'La disposición no devolvió una operación auditable.',
        );
      },
    );
  },
);
