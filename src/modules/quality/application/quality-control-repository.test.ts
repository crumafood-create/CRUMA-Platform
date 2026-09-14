import { describe, expect, it } from 'vitest';

import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

import {
  decideQualityRelease,
  recordQualityInspection,
} from './quality-control-repository';

describe('repositorio de control de calidad', () => {
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
