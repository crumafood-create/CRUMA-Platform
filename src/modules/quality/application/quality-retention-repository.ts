import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

export type QualityRetentionDailyClose = {
  close_date: string;
  closed_at: string;
  retained_sample_count: number;
  retained_quantity: number;
};

export type QualityRetentionMonthlyIndicator = {
  product_id: string;
  product_name: string;
  preparation_type_id: string | null;
  preparation_name: string | null;
  retained_quantity: number;
  gross_production_quantity: number;
  retention_percentage: number | null;
  direct_quality_waste_quantity: number;
  month_closed: boolean;
};

type QualityRetentionRpcClient = {
  rpc: (name: string, args?: Record<string, string | number>) => Promise<{
    data: unknown;
    error: { message: string } | null;
  }>;
};

function retentionClient(supabase: TypedSupabaseClient): QualityRetentionRpcClient {
  return supabase as unknown as QualityRetentionRpcClient;
}

export async function closeQualityRetentionDay(
  supabase: TypedSupabaseClient,
  closeDate: string,
): Promise<string> {
  const { data, error } = await retentionClient(supabase).rpc(
    'close_quality_retention_day',
    { p_close_date: closeDate },
  );
  if (error) throw new Error(error.message);
  if (typeof data !== 'string') throw new Error('El cierre de Calidad no devolvió un identificador.');
  return data;
}

export async function getQualityRetentionDailyCloses(
  supabase: TypedSupabaseClient,
): Promise<QualityRetentionDailyClose[]> {
  const { data, error } = await retentionClient(supabase).rpc(
    'get_quality_retention_daily_closes',
    { p_limit: 31 },
  );
  if (error) throw new Error(error.message);
  return (data ?? []) as QualityRetentionDailyClose[];
}

export async function getQualityRetentionMonthlyIndicator(
  supabase: TypedSupabaseClient,
  month: string,
): Promise<QualityRetentionMonthlyIndicator[]> {
  const { data, error } = await retentionClient(supabase).rpc(
    'get_quality_retention_monthly_indicator',
    { p_month: month },
  );
  if (error) throw new Error(error.message);
  return (data ?? []) as QualityRetentionMonthlyIndicator[];
}
