import { describe, expect, it } from 'vitest';

import type {
  TypedSupabaseClient,
} from '@/infrastructure/integrations/supabase/database.types';

import {
  decideRawMaterialQualityRelease,
  recordPreparedIngredientQualityInspection,
  releasePreparedIngredientQualityLot,
  recordRawMaterialQualityInspection,
} from './quality-control-repository';

describe('repositorio de calidad de materia prima', () => {
  it('inspecciona y libera una preparación con condición de almacén y caducidad interna', async () => {
    const calls: unknown[] = [];
    const client = {
      rpc: async (...args: unknown[]) => {
        calls.push(args);
        return { data: 'inspection-or-decision-1', error: null };
      },
    } as unknown as TypedSupabaseClient;
    const request = {
      rawMaterialLotId: 'prepared-lot-1',
      sampledQuantity: 0.05,
      notes: 'Inspección de lote preparado',
      criteria: [{ criterion: 'Apariencia', expectedValue: 'Apto', actualValue: 'Apto', passed: true }],
      defects: [],
    };

    await expect(recordPreparedIngredientQualityInspection(client, request)).resolves.toBe('inspection-or-decision-1');
    await expect(releasePreparedIngredientQualityLot(client, {
      inspectionId: 'inspection-1',
      storageCondition: 'refrigerated',
      locationId: 'location-1',
      expirationDate: '2026-11-30',
      reason: 'Vida interna definida por Calidad',
    })).resolves.toBe('inspection-or-decision-1');

    expect(calls).toEqual([
      ['record_prepared_ingredient_quality_inspection', {
        p_lot_id: 'prepared-lot-1',
        p_sampled_quantity: 0.05,
        p_notes: 'Inspección de lote preparado',
        p_criteria: [{ criterion: 'Apariencia', expected_value: 'Apto', actual_value: 'Apto', passed: true }],
        p_defects: [],
      }],
      ['release_prepared_ingredient_quality_lot', {
        p_inspection_id: 'inspection-1',
        p_storage_condition: 'refrigerated',
        p_inventory_location_id: 'location-1',
        p_expiration_date: '2026-11-30',
        p_reason: 'Vida interna definida por Calidad',
      }],
    ]);
  });

  it('registra la inspección mediante una RPC', async () => {
    const calls: unknown[] = [];

    const client = {
      rpc: async (...args: unknown[]) => {
        calls.push(args);

        return {
          data: 'inspection-1',
          error: null,
        };
      },
    } as unknown as TypedSupabaseClient;

    await expect(
      recordRawMaterialQualityInspection(
        client,
        {
          rawMaterialLotId: 'lot-1',
          sampledQuantity: 0.125,
          notes: 'Muestra de recepción',
          criteria: [
            {
              criterion: 'Apariencia',
              expectedValue: 'Uniforme',
              actualValue: 'Uniforme',
              passed: true,
            },
          ],
          defects: [
            {
              defectType: 'Partícula extraña',
              severity: 'minor',
              quantity: 0.025,
              description: null,
            },
          ],
        },
      ),
    ).resolves.toBe('inspection-1');

    expect(calls).toEqual([
      [
        'record_raw_material_quality_inspection',
        {
          p_criteria: [
            {
              criterion: 'Apariencia',
              expected_value: 'Uniforme',
              actual_value: 'Uniforme',
              passed: true,
            },
          ],
          p_defects: [
            {
              defect_type: 'Partícula extraña',
              severity: 'minor',
              quantity: 0.025,
              description: null,
            },
          ],
          p_lot_id: 'lot-1',
          p_notes: 'Muestra de recepción',
          p_sampled_quantity: 0.125,
        },
      ],
    ]);
  });

  it('registra la disposición del lote y propaga errores', async () => {
    const calls: unknown[] = [];

    const client = {
      rpc: async (...args: unknown[]) => {
        calls.push(args);

        return {
          data: 'decision-1',
          error: null,
        };
      },
    } as unknown as TypedSupabaseClient;

    await expect(
      decideRawMaterialQualityRelease(
        client,
        'inspection-1',
        'release',
        'Cumple especificación',
      ),
    ).resolves.toBe('decision-1');

    expect(calls).toEqual([
      [
        'decide_raw_material_quality_release',
        {
          p_decision: 'release',
          p_inspection_id: 'inspection-1',
          p_reason: 'Cumple especificación',
        },
      ],
    ]);

    const failing = {
      rpc: async () => ({
        data: null,
        error: {
          message:
            'Raw material inspection cannot be released.',
        },
      }),
    } as unknown as TypedSupabaseClient;

    await expect(
      decideRawMaterialQualityRelease(
        failing,
        'inspection-1',
        'release',
        null,
      ),
    ).rejects.toThrow(
      'Raw material inspection cannot be released.',
    );
  });
});
