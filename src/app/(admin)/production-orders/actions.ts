'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export async function createProductionOrder(
  formData: FormData
) {
  const supabase = await createClient();

  const { error } =
    await supabase
      .from('production_orders')
      .insert({
        recipe_id:
          formData.get('recipe_id'),

        quantity:
          Number(
            formData.get('quantity')
          ),

        status: 'draft',

        notes:
          formData.get('notes'),
      });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(
    '/production-orders'
  );

  redirect(
    '/production-orders'
  );
}
export async function startProductionOrder(
  orderId: string
) {
  const supabase = await createClient();

  const { error } =
    await supabase
      .from('production_orders')
      .update({
        status: 'in_progress',
        updated_at: new Date(),
      })
      .eq('id', orderId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/production-orders');
}
