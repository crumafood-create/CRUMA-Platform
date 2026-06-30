'use server';

import crypto from 'crypto';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/infrastructure/integrations/supabase/server';

function generateCustomerCode() {
  return `CLI-${crypto
    .randomUUID()
    .slice(0, 6)
    .toUpperCase()}`;
}

export async function createCustomer(
  formData: FormData,
) {
  const supabase =
    await createClient();

  const payload = {
    customer_code:
      formData.get(
        'customer_code',
      ) ||
      generateCustomerCode(),

    customer_type:
      formData.get(
        'customer_type',
      ),

    name:
      formData.get('name'),

    company_name:
      formData.get(
        'company_name',
      ) || null,

    tax_id:
      formData.get(
        'tax_id',
      ) || null,

    email:
      formData.get(
        'email',
      ) || null,

    phone:
      formData.get(
        'phone',
      ) || null,

    mobile:
      formData.get(
        'mobile',
      ) || null,

    address:
      formData.get(
        'address',
      ) || null,

    city:
      formData.get(
        'city',
      ) || null,

    state:
      formData.get(
        'state',
      ) || null,

    postal_code:
      formData.get(
        'postal_code',
      ) || null,

    notes:
      formData.get(
        'notes',
      ) || null,

    credit_limit:
      Number(
        formData.get(
          'credit_limit',
        ),
      ) || 0,

    is_active:
      formData.get(
        'is_active',
      ) === 'true',
  };

  const { error } =
    await supabase
      .from('customers')
      .insert(payload);

  if (error) {
    throw new Error(
      error.message,
    );
  }

  revalidatePath(
    '/customers',
  );

  redirect('/customers');
}

export async function updateCustomer(
  customerId: string,
  formData: FormData,
) {
  const supabase =
    await createClient();

  const payload = {
    customer_type:
      formData.get(
        'customer_type',
      ),

    name:
      formData.get('name'),

    company_name:
      formData.get(
        'company_name',
      ) || null,

    tax_id:
      formData.get(
        'tax_id',
      ) || null,

    email:
      formData.get(
        'email',
      ) || null,

    phone:
      formData.get(
        'phone',
      ) || null,

    mobile:
      formData.get(
        'mobile',
      ) || null,

    address:
      formData.get(
        'address',
      ) || null,

    city:
      formData.get(
        'city',
      ) || null,

    state:
      formData.get(
        'state',
      ) || null,

    postal_code:
      formData.get(
        'postal_code',
      ) || null,

    notes:
      formData.get(
        'notes',
      ) || null,

    credit_limit:
      Number(
        formData.get(
          'credit_limit',
        ),
      ) || 0,

    is_active:
      formData.get(
        'is_active',
      ) === 'true',

    updated_at:
      new Date().toISOString(),
  };

  const { error } =
    await supabase
      .from('customers')
      .update(payload)
      .eq(
        'id',
        customerId,
      );

  if (error) {
    throw new Error(
      error.message,
    );
  }

  revalidatePath(
    '/customers',
  );

  redirect('/customers');
}

export async function deleteCustomer(
  customerId: string,
) {
  const supabase =
    await createClient();

  const { error } =
    await supabase
      .from('customers')
      .update({
        deleted_at:
          new Date().toISOString(),
      })
      .eq(
        'id',
        customerId,
      );

  if (error) {
    throw new Error(
      error.message,
    );
  }

  revalidatePath(
    '/customers',
  );

  redirect('/customers');
}
