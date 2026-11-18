'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireTypedAuthorizedAction } from '@/modules/identity/guards/action.guard';
import { PERMISSIONS } from '@/modules/identity/permissions/permissions.constants';
import {
  buildCheeseCutRequest,
  buildCheeseGratingRequest,
} from '@/modules/production/application/cheese-preparation-contract';
import {
  recordCheeseCut,
  recordCheeseGrating,
} from '@/modules/production/application/cheese-preparation-repository';

export async function recordCheeseCutAction(formData: FormData) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.INVENTORY_ADJUSTMENT_CREATE,
  );
  await recordCheeseCut(supabase, buildCheeseCutRequest(formData));
  revalidatePath('/cheese-preparation');
  revalidatePath('/raw-materials');
  revalidatePath('/inventory-stock');
  redirect('/cheese-preparation?cut=recorded');
}

export async function recordCheeseGratingAction(formData: FormData) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.INVENTORY_ADJUSTMENT_CREATE,
  );
  await recordCheeseGrating(supabase, buildCheeseGratingRequest(formData));
  revalidatePath('/cheese-preparation');
  revalidatePath('/raw-materials');
  revalidatePath('/inventory-stock');
  redirect('/cheese-preparation?grate=recorded');
}
