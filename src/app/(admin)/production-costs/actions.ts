'use server';

import { revalidatePath } from 'next/cache';

import { requireTypedAuthorizedAction } from '@/modules/identity/guards/action.guard';
import { PERMISSIONS } from '@/modules/identity/permissions/permissions.constants';
import { buildProductionCostRequest } from '@/modules/production/application/production-cost-contract';
import { calculateProductionCost as persistProductionCost } from '@/modules/production/application/production-cost-repository';

export async function calculateProductionCost(
  productionOrderId: string,
  formData: FormData,
): Promise<void> {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.PRODUCTION_COST_CALCULATE,
  );
  const request = buildProductionCostRequest(formData, productionOrderId);
  await persistProductionCost(supabase, request);
  revalidatePath('/production-costs');
  revalidatePath(`/production-costs/${productionOrderId}`);
  revalidatePath(`/production-orders/${productionOrderId}`);
}
