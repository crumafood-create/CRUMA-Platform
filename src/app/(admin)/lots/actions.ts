'use server';

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  requireTypedAuthorizedAction,
} from '@/modules/identity/guards/action.guard';
import {
  PERMISSIONS,
} from '@/modules/identity/permissions/permissions.constants';
import {
  buildFinishedProductQualityReleaseRequest,
} from '@/modules/production/application/finished-product-quality-release-contract';
import {
  releaseFinishedProductQualityToInventory as persistFinishedProductRelease,
} from '@/modules/production/application/finished-product-quality-release-repository';

export async function releaseFinishedProductQualityToInventory(
  formData: FormData,
): Promise<void> {
  const { supabase } =
    await requireTypedAuthorizedAction(
      PERMISSIONS.PRODUCTION_LOT_RELEASE,
    );

  const request =
    buildFinishedProductQualityReleaseRequest(
      formData,
    );

  await persistFinishedProductRelease(
    supabase,
    request,
  );

  revalidatePath('/qa');
  revalidatePath(
    `/qa/${request.qualityInspectionId}`,
  );
  revalidatePath('/lots');
  revalidatePath('/inventory');
  revalidatePath('/mobile/picking');
  revalidatePath('/production-orders');

  redirect('/lots');
}