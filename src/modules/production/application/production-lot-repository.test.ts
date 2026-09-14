import { describe, expect, it } from 'vitest';

import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

import { releaseProductionOutputToInventory } from './production-lot-repository';

describe('repositorio de lotes producidos', () => {
  it('libera la salida mediante una única RPC', async () => {
    const calls: unknown[] = [];
    const client = { rpc: async (...args: unknown[]) => {
      calls.push(args);
      return { data: 'lot-1', error: null };
    } } as unknown as TypedSupabaseClient;

    await expect(releaseProductionOutputToInventory(client, {
      productionOutputId: 'output-1',
      lotNumber: 'PT-001',
      expirationDate: '2099-12-31',
      warehouseId: 'warehouse-1',
      inventoryLocationId: 'location-1',
    })).resolves.toBe('lot-1');

    expect(calls).toEqual([['release_production_output_to_inventory', {
      p_expiration_date: '2099-12-31',
      p_inventory_location_id: 'location-1',
      p_lot_number: 'PT-001',
      p_output_id: 'output-1',
      p_warehouse_id: 'warehouse-1',
    }]]);
  });

  it('propaga el error transaccional', async () => {
    const client = { rpc: async () => ({
      data: null,
      error: { message: 'Production output is not quality released.' },
    }) } as unknown as TypedSupabaseClient;

    await expect(releaseProductionOutputToInventory(client, {
      productionOutputId: 'output-1',
      lotNumber: 'PT-001',
      expirationDate: '2099-12-31',
      warehouseId: 'warehouse-1',
      inventoryLocationId: 'location-1',
    })).rejects.toThrow('Production output is not quality released.');
  });
});
