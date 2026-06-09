'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export async function createInventoryLocation(
  formData: FormData
) {
  const supabase = await createClient();

  const { error } =
    await supabase
      .from('inventory_locations')
      .insert({
        name: formData.get('name'),
        slug: formData.get('slug'),
        description:
          formData.get('description'),
        is_active:
          formData.get('is_active') === 'true',
      });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(
    '/inventory-locations'
  );

  redirect(
    '/inventory-locations'
  );
}
