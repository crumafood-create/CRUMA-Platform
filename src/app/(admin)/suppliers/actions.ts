'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export async function createSupplier(
  formData: FormData
) {
  const supabase =
    await createClient();

  const { error } =
    await supabase
      .from('suppliers')
      .insert({
        name: formData.get('name'),
        business_name:
          formData.get(
            'business_name'
          ),
        tax_id:
          formData.get('tax_id'),
        email:
          formData.get('email'),
        phone:
          formData.get('phone'),
        contact_name:
          formData.get(
            'contact_name'
          ),
        address:
          formData.get('address'),
        notes:
          formData.get('notes'),
        is_active:
          formData.get(
            'is_active'
          ) === 'true',
      });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/suppliers');

  redirect('/suppliers');
}
