'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireTypedAuthorizedAction } from '@/modules/identity/guards/action.guard';
import { PERMISSIONS } from '@/modules/identity/permissions/permissions.constants';
import {
  assertQualityDecision,
  buildProductLotQualitySampleDispositionRequest,
  buildProductLotQualitySampleInspectionRequest,
  buildQualityInspectionRequest,
  buildRawMaterialQualityInspectionRequest,
} from '@/modules/quality/application/quality-control-contract';
import {
  decideQualityRelease as persistQualityDecision,
  decideProductLotQualitySampleDisposition as
    persistProductLotQualitySampleDisposition,
  decideRawMaterialQualityRelease as persistRawMaterialQualityDecision,
  recordProductLotQualitySampleInspection as persistProductLotQualitySampleInspection,
  recordQualityInspection as persistQualityInspection,
  recordRawMaterialQualityInspection as persistRawMaterialQualityInspection,
  recordPreparedIngredientQualityInspection as persistPreparedIngredientQualityInspection,
  releasePreparedIngredientQualityLot as persistPreparedIngredientQualityRelease,
  retainPreparedIngredientForStorageCorrection as persistPreparedIngredientStorageCorrection,
} from '@/modules/quality/application/quality-control-repository';
import { closeQualityRetentionDay as persistQualityRetentionDailyClose } from '@/modules/quality/application/quality-retention-repository';
import {
  buildFinishedProductNonconformanceDispositionRequest,
} from '@/modules/production/application/finished-product-nonconformance-disposition-contract';
import {
  disposeFinishedProductNonconformance as
    persistFinishedProductNonconformanceDisposition,
} from '@/modules/production/application/finished-product-nonconformance-disposition-repository';

export async function recordQualityInspection(
  formData: FormData,
): Promise<void> {
  const { supabase } =
    await requireTypedAuthorizedAction(
      PERMISSIONS.QUALITY_INSPECTION_MANAGE,
    );

  const request =
    buildQualityInspectionRequest(formData);

  const inspectionId =
    await persistQualityInspection(
      supabase,
      request,
    );

  revalidatePath('/qa');
  revalidatePath('/production-orders');
  redirect(`/qa/${inspectionId}`);
}

export async function recordProductLotQualitySampleInspection(
  formData: FormData,
): Promise<void> {
  const { supabase } =
    await requireTypedAuthorizedAction(
      PERMISSIONS.QUALITY_INSPECTION_MANAGE,
    );

  const request =
    buildProductLotQualitySampleInspectionRequest(formData);
  const inspectionId =
    await persistProductLotQualitySampleInspection(
      supabase,
      request,
    );

  revalidatePath('/qa');
  revalidatePath('/qa/create');
  revalidatePath('/lots/storage-conditions');
  revalidatePath('/mobile/picking');
  redirect(`/qa/${inspectionId}`);
}

export async function decideProductLotQualitySampleDisposition(
  formData: FormData,
): Promise<void> {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.QUALITY_RELEASE_DECIDE,
  );
  const request = buildProductLotQualitySampleDispositionRequest(formData);
  await persistProductLotQualitySampleDisposition(supabase, request);

  revalidatePath('/qa');
  revalidatePath(`/qa/${request.qualityInspectionId}`);
  revalidatePath('/lots');
  revalidatePath('/lots/storage-conditions');
  revalidatePath('/mobile/picking');
  redirect(`/qa/${request.qualityInspectionId}`);
}

export async function closeQualityRetentionDay(
  formData: FormData,
): Promise<void> {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.QUALITY_RELEASE_DECIDE,
  );
  const closeDate = formData.get('close_date')?.toString().trim() ?? '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(closeDate)) {
    throw new Error('La fecha del cierre diario no es válida.');
  }

  await persistQualityRetentionDailyClose(supabase, closeDate);

  revalidatePath('/qa/retention');
  revalidatePath('/qa');
  redirect(`/qa/retention?closed=${encodeURIComponent(closeDate)}`);
}

export async function decideQualityRelease(
  inspectionId: string,
  decisionValue: string,
  formData: FormData,
): Promise<void> {
  const { supabase } =
    await requireTypedAuthorizedAction(
      PERMISSIONS.QUALITY_RELEASE_DECIDE,
    );

  const decision =
    assertQualityDecision(decisionValue);

  const reason =
    formData.get('reason')?.toString().trim() ||
    null;

  await persistQualityDecision(
    supabase,
    inspectionId,
    decision,
    reason,
  );

  revalidatePath('/qa');
  revalidatePath(`/qa/${inspectionId}`);
  revalidatePath('/production-orders');
}

export async function disposeFinishedProductNonconformance(
  formData: FormData,
): Promise<void> {
  const { supabase } =
    await requireTypedAuthorizedAction(
      PERMISSIONS.QUALITY_RELEASE_DECIDE,
    );

  const request =
    buildFinishedProductNonconformanceDispositionRequest(
      formData,
    );

  await persistFinishedProductNonconformanceDisposition(
    supabase,
    request,
  );

  revalidatePath('/qa');
  revalidatePath(
    `/qa/${request.qualityInspectionId}`,
  );
  revalidatePath('/production-orders');
}

export async function recordRawMaterialQualityInspection(
  formData: FormData,
): Promise<void> {
  const { supabase } =
    await requireTypedAuthorizedAction(
      PERMISSIONS.QUALITY_INSPECTION_MANAGE,
    );

  const request =
    buildRawMaterialQualityInspectionRequest(
      formData,
    );

  const preparedOperation = await supabase
    .from('cheese_preparation_operations')
    .select('id')
    .or(`output_lot_id.eq.${request.rawMaterialLotId},secondary_lot_id.eq.${request.rawMaterialLotId}`)
    .limit(1)
    .maybeSingle();
  if (preparedOperation.error) {
    throw new Error('No fue posible identificar el origen del lote preparado.');
  }

  const inspectionId =
    preparedOperation.data
      ? await persistPreparedIngredientQualityInspection(supabase, request)
      : await persistRawMaterialQualityInspection(supabase, request);

  revalidatePath('/qa');
  revalidatePath('/inventory');
  revalidatePath('/purchase-orders');
  redirect(`/qa/${inspectionId}`);
}

export async function releasePreparedIngredientQualityLot(
  inspectionId: string,
  formData: FormData,
): Promise<void> {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.QUALITY_RELEASE_DECIDE,
  );
  const storageCondition = formData.get('storage_condition')?.toString() ?? '';
  if (storageCondition !== 'dry' && storageCondition !== 'refrigerated') {
    throw new Error('Selecciona almacén seco o refrigerado.');
  }
  const locationId = formData.get('inventory_location_id')?.toString().trim() ?? '';
  const expirationDate = formData.get('expiration_date')?.toString().trim() ?? '';
  const reason = formData.get('reason')?.toString().trim() ?? '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(inspectionId)
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(locationId)
    || !/^\d{4}-\d{2}-\d{2}$/.test(expirationDate)) {
    throw new Error('Indica una ubicación y fecha de caducidad válidas.');
  }
  await persistPreparedIngredientQualityRelease(supabase, {
    inspectionId,
    storageCondition,
    locationId,
    expirationDate,
    reason: reason || null,
  });
  revalidatePath('/qa');
  revalidatePath(`/qa/${inspectionId}`);
  revalidatePath('/ingredient-preparation');
  revalidatePath('/raw-materials');
  revalidatePath('/inventory-stock');
  redirect(`/qa/${inspectionId}`);
}

export async function retainPreparedIngredientForStorageCorrection(
  inspectionId: string,
  formData: FormData,
): Promise<void> {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.QUALITY_RELEASE_DECIDE,
  );
  const reason = formData.get('reason')?.toString().trim() ?? '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(inspectionId)
    || !reason || reason.length > 500) {
    throw new Error('Indica un motivo de retención válido (máximo 500 caracteres).');
  }
  await persistPreparedIngredientStorageCorrection(supabase, {
    inspectionId,
    reason,
  });
  revalidatePath('/qa');
  revalidatePath(`/qa/${inspectionId}`);
  revalidatePath('/raw-materials');
  revalidatePath('/ingredient-preparation');
  revalidatePath('/inventory-stock');
  redirect(`/qa/${inspectionId}`);
}

export async function decideRawMaterialQualityRelease(
  inspectionId: string,
  decisionValue: string,
  formData: FormData,
): Promise<void> {
  const { supabase } =
    await requireTypedAuthorizedAction(
      PERMISSIONS.QUALITY_RELEASE_DECIDE,
    );

  const decision =
    assertQualityDecision(decisionValue);

  const reason =
    formData.get('reason')?.toString().trim() ||
    null;

  await persistRawMaterialQualityDecision(
    supabase,
    inspectionId,
    decision,
    reason,
  );

  revalidatePath('/qa');
  revalidatePath(`/qa/${inspectionId}`);
  revalidatePath('/inventory');
  revalidatePath('/purchase-orders');
}
