'use server';

import { revalidatePath } from 'next/cache';

import { requireTypedAuthorizedAction } from '@/lib/auth/guards/action.guard';
import { PERMISSIONS } from '@/lib/auth/permissions/permissions.constants';
import { buildRecipeItemInsert } from '@/modules/production/application/recipe-contract';
import { assertRecipeItemReferencesAvailable } from '@/modules/production/application/recipe-repository';

export async function createRecipeItem(formData: FormData) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.PRODUCTION_RECIPE_MANAGE,
  );
  const item = buildRecipeItemInsert(formData);

  await assertRecipeItemReferencesAvailable(
    supabase,
    item.recipe_id,
    item.raw_material_id,
  );

  const { error } = await supabase.from('recipe_items').insert(item);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/recipes/${item.recipe_id}/ingredients`);
}
