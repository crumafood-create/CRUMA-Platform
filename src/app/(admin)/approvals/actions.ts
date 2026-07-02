'use server';

import { revalidatePath } from 'next/cache';

import { createClient }
  from '@/infrastructure/integrations/supabase/server';

export async function approve(
  approvalId: string,
) {
  const supabase =
    await createClient();

  const {
    error,
  } = await supabase
    .from('approvals')
    .update({
      status:
        'approved',

      approved_at:
        new Date().toISOString(),

      updated_at:
        new Date().toISOString(),
    })
    .eq(
      'id',
      approvalId,
    );

  if (error) {
    throw new Error(
      error.message,
    );
  }

  revalidatePath(
    '/approvals',
  );
}
