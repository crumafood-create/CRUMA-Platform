'use server';

import { revalidatePath } from 'next/cache';

import { generateSystemNotifications }
  from '@/app/(admin)/notifications/actions';

import { calculateDemandForecasts }
  from '@/app/(admin)/demand-forecasts/actions';

import { createClient }
  from '@/infrastructure/integrations/supabase/server';

export async function runSystemJobs() {
  const supabase =
    await createClient();

  const {
    data: jobs,
    error,
  } = await supabase
    .from(
      'scheduled_jobs',
    )
    .select('*')
    .eq(
      'is_active',
      true,
    );

  if (error) {
    throw new Error(
      error.message,
    );
  }

  for (const job of jobs ?? []) {
    switch (
      job.job_key
    ) {
      case
        'notifications':
        await generateSystemNotifications();
        break;

      case
        'forecast':
        await calculateDemandForecasts();
        break;

      case
        'dashboard':
        break;

      default:
        break;
    }

    await supabase
      .from(
        'scheduled_jobs',
      )
      .update({
        last_run_at:
          new Date().toISOString(),

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        'id',
        job.id,
      );
  }

  revalidatePath(
    '/dashboard',
  );

  revalidatePath(
    '/notifications',
  );

  revalidatePath(
    '/demand-forecasts',
  );
}
