import { describe, expect, it, vi } from 'vitest';

import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

import {
  closeQualityRetentionDay,
  getQualityRetentionDailyCloses,
  getQualityRetentionMonthlyIndicator,
} from './quality-retention-repository';

function clientReturning(data: unknown) {
  return {
    rpc: vi.fn().mockResolvedValue({ data, error: null }),
  } as unknown as TypedSupabaseClient & { rpc: ReturnType<typeof vi.fn> };
}

describe('quality retention repository', () => {
  it('closes the selected local day through the guarded RPC', async () => {
    const client = clientReturning('close-1');
    await expect(closeQualityRetentionDay(client, '2026-11-17')).resolves.toBe('close-1');
    expect(client.rpc).toHaveBeenCalledWith('close_quality_retention_day', {
      p_close_date: '2026-11-17',
    });
  });

  it('loads daily snapshots and the selected month indicator', async () => {
    const daily = clientReturning([{ close_date: '2026-11-17' }]);
    await expect(getQualityRetentionDailyCloses(daily)).resolves.toEqual([
      { close_date: '2026-11-17' },
    ]);
    expect(daily.rpc).toHaveBeenCalledWith('get_quality_retention_daily_closes', {
      p_limit: 31,
    });

    const monthly = clientReturning([{ retained_quantity: 3, gross_production_quantity: 48 }]);
    await expect(getQualityRetentionMonthlyIndicator(monthly, '2026-10-01')).resolves.toEqual([
      { retained_quantity: 3, gross_production_quantity: 48 },
    ]);
    expect(monthly.rpc).toHaveBeenCalledWith('get_quality_retention_monthly_indicator', {
      p_month: '2026-10-01',
    });
  });
});
