'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export async function markNotificationAsRead(
  notificationId: string,
) {
  const supabase =
    await createClient();

  const { error } =
    await supabase
      .from(
        'notifications',
      )
      .update({
        is_read: true,
        updated_at:
          new Date().toISOString(),
      })
      .eq(
        'id',
        notificationId,
      );

  if (error) {
    throw new Error(
      error.message,
    );
  }

  revalidatePath(
    '/notifications',
  );

  revalidatePath(
    '/dashboard',
  );
}
