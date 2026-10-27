'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireTypedAuthorizedAction } from '@/modules/identity/guards/action.guard';
import { PERMISSIONS } from '@/modules/identity/permissions/permissions.constants';
import {
  buildRawMaterialInsert,
  buildRawMaterialUpdate,
} from '@/modules/inventory/application/raw-material-contract';
import { assertRawMaterialFamilyBelongsToCategory } from '@/modules/inventory/application/raw-material-repository';

export async function createRawMaterial(
  returnToPurchaseOrderId: string | null,
  formData: FormData,
) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.INVENTORY_MATERIAL_MANAGE,
  );
  const material = {
    ...buildRawMaterialInsert(formData),
    current_stock: 0,
    average_cost: 0,
  };

  await assertRawMaterialFamilyBelongsToCategory(
    supabase,
    material.category_id ?? null,
    material.family_id ?? null,
  );

  const { data: createdMaterial, error } = await supabase
    .from('raw_materials')
    .insert(material)
    .select('id')
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/raw-materials');
  redirect(
    returnToPurchaseOrderId
      ? `/purchase-orders/${returnToPurchaseOrderId}/items?rawMaterialId=${createdMaterial.id}`
      : '/raw-materials?created=1',
  );
}

export async function updateRawMaterial(materialId: string, formData: FormData) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.INVENTORY_MATERIAL_MANAGE,
  );
  const material = buildRawMaterialUpdate(formData, new Date().toISOString());

  await assertRawMaterialFamilyBelongsToCategory(
    supabase,
    material.category_id ?? null,
    material.family_id ?? null,
  );

  const { error } = await supabase
    .from('raw_materials')
    .update(material)
    .eq('id', materialId);

  if (error) throw new Error(error.message);

  revalidatePath('/raw-materials');
  revalidatePath('/inventory/alerts');
  redirect('/raw-materials');
}

export async function deleteRawMaterial(materialId: string) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.INVENTORY_MATERIAL_MANAGE,
  );
  const { error } = await supabase
    .from('raw_materials')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', materialId);

  if (error) throw new Error(error.message);

  revalidatePath('/raw-materials');
  revalidatePath('/inventory/alerts');
  redirect('/raw-materials');
}
