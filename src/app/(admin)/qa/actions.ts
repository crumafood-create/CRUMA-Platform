'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireTypedAuthorizedAction } from '@/modules/identity/guards/action.guard';
import { PERMISSIONS } from '@/modules/identity/permissions/permissions.constants';
import {
  assertQualityDecision,
  buildQualityInspectionRequest,
} from '@/modules/quality/application/quality-control-contract';
import {
  decideQualityRelease as persistQualityDecision,
  recordQualityInspection as persistQualityInspection,
} from '@/modules/quality/application/quality-control-repository';

export async function recordQualityInspection(formData: FormData): Promise<void> {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.QUALITY_INSPECTION_MANAGE,
  );
  const request = buildQualityInspectionRequest(formData);
  const inspectionId = await persistQualityInspection(supabase, request);
  revalidatePath('/qa');
  revalidatePath('/production-orders');
  redirect(`/qa/${inspectionId}`);
}

export async function decideQualityRelease(
  inspectionId: string,
  decisionValue: string,
  formData: FormData,
): Promise<void> {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.QUALITY_RELEASE_DECIDE,
  );
  const decision = assertQualityDecision(decisionValue);
  const reason = formData.get('reason')?.toString().trim() || null;
  await persistQualityDecision(supabase, inspectionId, decision, reason);
  revalidatePath('/qa');
  revalidatePath(`/qa/${inspectionId}`);
  revalidatePath('/production-orders');
}
