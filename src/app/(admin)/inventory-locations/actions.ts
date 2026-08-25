'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireTypedAuthorizedAction } from '@/lib/auth/guards/action.guard';
import { PERMISSIONS } from '@/lib/auth/permissions/permissions.constants';
import {
  buildInventoryLocationInsert,
  buildInventoryLocationUpdate,
} from '@/modules/inventory/application/inventory-location-contract';
import {
  assertInventoryLocationCanBeDeleted,
  assertInventoryLocationSlugAvailable,
} from '@/modules/inventory/application/inventory-location-repository';

export async function createInventoryLocation(formData: FormData) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.INVENTORY_LOCATION_MANAGE,
  );
  const location = buildInventoryLocationInsert(formData);

  await assertInventoryLocationSlugAvailable(supabase, location.slug);

  const { error } = await supabase.from('inventory_locations').insert(location);

  if (error) throw new Error(error.message);

  revalidatePath('/inventory-locations');
  redirect('/inventory-locations');
}

export async function updateInventoryLocation(locationId: string, formData: FormData) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.INVENTORY_LOCATION_MANAGE,
  );
  const location = buildInventoryLocationUpdate(formData, new Date().toISOString());

  await assertInventoryLocationSlugAvailable(supabase, location.slug, locationId);

  const { error } = await supabase
    .from('inventory_locations')
    .update(location)
    .eq('id', locationId);

  if (error) throw new Error(error.message);

  revalidatePath('/inventory-locations');
  redirect('/inventory-locations');
}

export async function deleteInventoryLocation(locationId: string) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.INVENTORY_LOCATION_MANAGE,
  );

  await assertInventoryLocationCanBeDeleted(supabase, locationId);

  const { error } = await supabase
    .from('inventory_locations')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', locationId);

  if (error) throw new Error(error.message);

  revalidatePath('/inventory-locations');
}
