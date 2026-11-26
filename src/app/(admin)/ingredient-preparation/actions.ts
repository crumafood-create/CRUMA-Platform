'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireTypedAuthorizedAction } from '@/modules/identity/guards/action.guard';
import { PERMISSIONS } from '@/modules/identity/permissions/permissions.constants';
import {
  buildCheeseCutRequest,
  buildCheeseGratingRequest,
  buildHamGratingRequest,
} from '@/modules/production/application/cheese-preparation-contract';
import {
  recordCheeseCut,
  recordCheeseGrating,
  recordHamGrating,
} from '@/modules/production/application/cheese-preparation-repository';

export async function recordCheeseCutAction(formData: FormData) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.INVENTORY_ADJUSTMENT_CREATE,
  );
  await recordCheeseCut(supabase, buildCheeseCutRequest(formData));
  revalidatePath('/ingredient-preparation');
  revalidatePath('/raw-materials');
  revalidatePath('/inventory-stock');
  redirect('/ingredient-preparation?cut=recorded');
}

export async function recordCheeseGratingAction(formData: FormData) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.INVENTORY_ADJUSTMENT_CREATE,
  );
  await recordCheeseGrating(supabase, buildCheeseGratingRequest(formData));
  revalidatePath('/ingredient-preparation');
  revalidatePath('/raw-materials');
  revalidatePath('/inventory-stock');
  redirect('/ingredient-preparation?grate=recorded');
}

export async function recordHamGratingAction(formData: FormData) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.INVENTORY_ADJUSTMENT_CREATE,
  );
  await recordHamGrating(supabase, buildHamGratingRequest(formData));
  revalidatePath('/ingredient-preparation');
  revalidatePath('/raw-materials');
  revalidatePath('/inventory-stock');
  redirect('/ingredient-preparation?ham=recorded');
}
