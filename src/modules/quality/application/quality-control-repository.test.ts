import { describe, expect, it } from 'vitest';

import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

import {
  decideProductLotQualitySampleDisposition,
  decideQualityRelease,
  recordProductLotQualitySampleInspection,
  recordQualityInspection,
} from './quality-control-repository';

describe('repositorio de control de calidad', () => {
  it('registra la disposición idempotente de una porción de muestra', async () => {
    const calls: unknown[] = [];
    const client = { rpc: async (...args: unknown[]) => {
      calls.push(args);
      return { data: 'sample-disposition-1', error: null };
    } } as unknown as TypedSupabaseClient;

    await expect(decideProductLotQualitySampleDisposition(client, {
      qualityInspectionId: 'inspection-1',
      sampleId: 'sample-1',
      quantity: 1,
      destination: 'returned_to_lot',
      returnAuthorized: true,
      reason: 'Calidad verificó que siguió intacta',
      idempotencyKey: 'fd000000-0000-4000-8000-000000000301',
    })).resolves.toBe('sample-disposition-1');

    expect(calls).toEqual([['decide_product_lot_quality_sample_disposition', {
      p_sample_id: 'sample-1',
      p_quality_inspection_id: 'inspection-1',
      p_quantity: 1,
      p_destination: 'returned_to_lot',
      p_return_authorized: true,
      p_reason: 'Calidad verificó que siguió intacta',
      p_idempotency_key: 'fd000000-0000-4000-8000-000000000301',
    }]]);
  });

  it('registra y evalúa la inspección en una sola RPC', async () => {
    const calls: unknown[] = [];
    const client = { rpc: async (...args: unknown[]) => {
      calls.push(args);
      return { data: 'inspection-1', error: null };
    } } as unknown as TypedSupabaseClient;

    await expect(recordQualityInspection(client, {
      productionOutputId: 'output-1',
      sampledQuantity: 5,
      notes: null,
      criteria: [{
        criterion: 'Apariencia', expectedValue: 'Uniforme',
        actualValue: 'Uniforme', passed: true,
      }],
      defects: [],
    })).resolves.toBe('inspection-1');

    expect(calls).toEqual([['record_quality_inspection', {
      p_criteria: [{
        criterion: 'Apariencia', expected_value: 'Uniforme',
        actual_value: 'Uniforme', passed: true,
      }],
      p_defects: [],
      p_notes: '',
      p_output_id: 'output-1',
      p_sampled_quantity: 5,
    }]]);
  });

  it('registra inspección de muestra con cantidad determinada por la base', async () => {
    const calls: unknown[] = [];
    const client = { rpc: async (...args: unknown[]) => {
      calls.push(args);
      return { data: 'inspection-sample-1', error: null };
    } } as unknown as TypedSupabaseClient;

    await expect(recordProductLotQualitySampleInspection(client, {
      sampleId: 'sample-1',
      notes: 'Integridad verificada',
      criteria: [{
        criterion: 'Integridad', expectedValue: 'Sin roturas',
        actualValue: 'Integras', passed: true,
      }],
      defects: [],
    })).resolves.toBe('inspection-sample-1');

    expect(calls).toEqual([['record_product_lot_quality_sample_inspection', {
      p_criteria: [{
        criterion: 'Integridad', expected_value: 'Sin roturas',
        actual_value: 'Integras', passed: true,
      }],
      p_defects: [],
      p_notes: 'Integridad verificada',
      p_sample_id: 'sample-1',
    }]]);
  });

  it('registra la decisión mediante RPC y propaga errores', async () => {
    const calls: unknown[] = [];
    const client = { rpc: async (...args: unknown[]) => {
      calls.push(args);
      return { data: 'decision-1', error: null };
    } } as unknown as TypedSupabaseClient;

    await expect(decideQualityRelease(
      client, 'inspection-1', 'release', 'Cumple especificación',
    )).resolves.toBe('decision-1');
    expect(calls).toEqual([['decide_quality_release', {
      p_decision: 'release',
      p_inspection_id: 'inspection-1',
      p_reason: 'Cumple especificación',
    }]]);

    const failing = { rpc: async () => ({
      data: null, error: { message: 'Inspection cannot be released.' },
    }) } as unknown as TypedSupabaseClient;
    await expect(decideQualityRelease(
      failing, 'inspection-1', 'release', null,
    )).rejects.toThrow('Inspection cannot be released.');
  });
});
