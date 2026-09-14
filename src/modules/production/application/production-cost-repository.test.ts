import { describe, expect, it } from 'vitest';

import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

import { calculateProductionCost } from './production-cost-repository';

describe('repositorio de costos de producción', () => {
  it('delega el cálculo y la auditoría a una sola RPC', async () => {
    const calls: unknown[] = [];
    const client = { rpc: async (...args: unknown[]) => {
      calls.push(args);
      return { data: 'cost-1', error: null };
    } } as unknown as TypedSupabaseClient;

    await expect(calculateProductionCost(client, {
      productionOrderId: 'order-1', laborCost: 20, overheadCost: 5,
    })).resolves.toBe('cost-1');
    expect(calls).toEqual([['calculate_production_cost', {
      p_labor_cost: 20,
      p_order_id: 'order-1',
      p_overhead_cost: 5,
    }]]);
  });

  it('propaga errores y rechaza respuestas vacías', async () => {
    const failing = ({ rpc: async () => ({ data: null, error: {
      message: 'Production order must be completed.',
    } }) }) as unknown as TypedSupabaseClient;
    await expect(calculateProductionCost(failing, {
      productionOrderId: 'order-1', laborCost: 0, overheadCost: 0,
    })).rejects.toThrow('Production order must be completed.');

    const empty = ({
      rpc: async () => ({ data: null, error: null }),
    }) as unknown as TypedSupabaseClient;
    await expect(calculateProductionCost(empty, {
      productionOrderId: 'order-1', laborCost: 0, overheadCost: 0,
    })).rejects.toThrow('La base de datos no devolvió el costo calculado.');
  });
});
