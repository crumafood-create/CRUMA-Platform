'use server';

import { revalidatePath } from 'next/cache';

import { requireTypedAuthorizedAction } from '@/modules/identity/guards/action.guard';
import { PERMISSIONS } from '@/modules/identity/permissions/permissions.constants';
import {
  buildRecipeItemDelete,
  buildRecipeItemInsert,
  buildRecipeItemUpdate,
} from '@/modules/production/application/recipe-contract';
import { assertRecipeItemReferencesAvailable } from '@/modules/production/application/recipe-repository';

export async function createRecipeItem(formData: FormData) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.PRODUCTION_RECIPE_MANAGE,
  );
  const item = buildRecipeItemInsert(formData);

  await assertRecipeItemReferencesAvailable(
    supabase,
    item.recipe_id,
    {
      rawMaterialId: item.raw_material_id,
      productId: item.product_id,
    },
  );

  const { error } = await supabase.from('recipe_items').insert(item);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/recipes/${item.recipe_id}/ingredients`);
}

export async function updateRecipeItem(formData: FormData) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.PRODUCTION_RECIPE_MANAGE,
  );
  const item = buildRecipeItemUpdate(formData);
  const { data: existing, error: lookupError } = await supabase
    .from('recipe_items')
    .select('id')
    .eq('id', item.id)
    .eq('recipe_id', item.recipe_id)
    .maybeSingle();

  if (lookupError) throw new Error(lookupError.message);
  if (!existing) throw new Error('El ingrediente no pertenece a esta receta.');

  await assertRecipeItemReferencesAvailable(
    supabase,
    item.recipe_id,
    { rawMaterialId: item.raw_material_id, productId: item.product_id },
    item.id,
  );

  const { data: updated, error } = await supabase
    .from('recipe_items')
    .update({
      raw_material_id: item.raw_material_id,
      product_id: item.product_id,
      quantity: item.quantity,
    })
    .eq('id', item.id)
    .eq('recipe_id', item.recipe_id)
    .select('id')
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!updated) throw new Error('El ingrediente no se pudo actualizar.');
  revalidatePath(`/recipes/${item.recipe_id}/ingredients`);
}

export async function deleteRecipeItem(formData: FormData) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.PRODUCTION_RECIPE_MANAGE,
  );
  const item = buildRecipeItemDelete(formData);
  const { data: deleted, error } = await supabase
    .from('recipe_items')
    .delete()
    .eq('id', item.id)
    .eq('recipe_id', item.recipe_id)
    .select('id')
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!deleted) throw new Error('El ingrediente no pertenece a esta receta.');
  revalidatePath(`/recipes/${item.recipe_id}/ingredients`);
}
