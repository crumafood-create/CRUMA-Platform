import { describe, expect, it } from 'vitest';

import type {
  TypedSupabaseClient,
} from '@/infrastructure/integrations/supabase/database.types';

import type {
  FinishedProductQualityReleaseRequest,
} from './finished-product-quality-release-contract';
import {
  releaseFinishedProductQualityToInventory,
} from './finished-product-quality-release-repository';

const REQUEST: FinishedProductQualityReleaseRequest = {
  qualityInspectionId:
    'a1000000-0000-4000-8000-000000000001',
  lotNumber: 'PT-2026/001',
  expirationDate: '2099-12-31',
  warehouseId:
    'a2000000-0000-4000-8000-000000000001',
  inventoryLocationId:
    'a3000000-0000-4000-8000-000000000001',
  idempotencyKey:
    'a4000000-0000-4000-8000-000000000001',
  reason: 'Cumple especificación',
};

describe(
  'repositorio de liberación de producto terminado',
  () => {
    it(
      'delega la liberación completa a una RPC',
      async () => {
        const calls: unknown[] = [];

        const client = {
          rpc: async (...args: unknown[]) => {
            calls.push(args);

            return {
              data:
                'a5000000-0000-4000-8000-000000000001',
              error: null,
            };
          },
        } as unknown as TypedSupabaseClient;

        await expect(
          releaseFinishedProductQualityToInventory(
            client,
            REQUEST,
          ),
        ).resolves.toBe(
          'a5000000-0000-4000-8000-000000000001',
        );

        expect(calls).toEqual([
          [
            'release_finished_product_quality_to_inventory',
            {
              p_expiration_date:
                '2099-12-31',
              p_idempotency_key:
                REQUEST.idempotencyKey,
              p_inspection_id:
                REQUEST.qualityInspectionId,
              p_inventory_location_id:
                REQUEST.inventoryLocationId,
              p_lot_number:
                'PT-2026/001',
              p_reason:
                'Cumple especificación',
              p_warehouse_id:
                REQUEST.warehouseId,
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
                'Inspection cannot be released.',
            },
          }),
        } as unknown as TypedSupabaseClient;

        await expect(
          releaseFinishedProductQualityToInventory(
            client,
            REQUEST,
          ),
        ).rejects.toThrow(
          'Inspection cannot be released.',
        );
      },
    );

    it(
      'rechaza una respuesta sin lote',
      async () => {
        const client = {
          rpc: async () => ({
            data: null,
            error: null,
          }),
        } as unknown as TypedSupabaseClient;

        await expect(
          releaseFinishedProductQualityToInventory(
            client,
            REQUEST,
          ),
        ).rejects.toThrow(
          'La liberación no devolvió un lote de producto terminado.',
        );
      },
    );
  },
);