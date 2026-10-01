import type {
  TypedSupabaseClient,
} from '@/infrastructure/integrations/supabase/database.types';

import type {
  FinishedProductNonconformanceDispositionRequest,
} from './finished-product-nonconformance-disposition-contract';

export async function disposeFinishedProductNonconformance(
  supabase: TypedSupabaseClient,
  request:
    FinishedProductNonconformanceDispositionRequest,
): Promise<string> {
  const { data, error } =
    await supabase.rpc(
      'dispose_finished_product_nonconformance',
      {
        p_disposition:
          request.disposition,
        p_idempotency_key:
          request.idempotencyKey,
        p_inspection_id:
          request.qualityInspectionId,
        p_reason:
          request.reason,
      },
    );

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(
      'La disposición no devolvió una operación auditable.',
    );
  }

  return data;
}
