'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireTypedAuthorizedAction } from '@/lib/auth/guards/action.guard';
import { PERMISSIONS } from '@/lib/auth/permissions/permissions.constants';
import { buildProductionLotReleaseRequest } from '@/modules/production/application/production-lot-contract';
import { releaseProductionOutputToInventory as persistRelease } from '@/modules/production/application/production-lot-repository';

export async function releaseProductionOutputToInventory(
  formData: FormData,
): Promise<void> {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.PRODUCTION_LOT_RELEASE,
  );
  const request = buildProductionLotReleaseRequest(formData);
  await persistRelease(supabase, request);
  revalidatePath('/lots');
  revalidatePath('/inventory');
  revalidatePath('/mobile/picking');
  revalidatePath(`/production-orders/${formData.get('production_order_id') ?? ''}`);
  redirect('/lots');
}
