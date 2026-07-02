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
    data: approval,
    error,
  } = await supabase
    .from(
      'approvals',
    )
    .select('*')
    .eq(
      'id',
      approvalId,
    )
    .single();

  if (
    error ||
    !approval
  ) {
    throw new Error(
      error?.message ??
        'Aprobación no encontrada',
    );
  }

  await supabase
    .from(
      'approvals',
    )
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

  //
  // Producción automática
  //
  if (
    approval.approval_type ===
      'production' &&
    approval.reference_type ===
      'product'
  ) {
    const {
      data: forecast,
    } = await supabase
      .from(
        'demand_forecasts',
      )
      .select(`
        suggested_production
      `)
      .eq(
        'product_id',
        approval.reference_id,
      )
      .single();

    const {
      data: recipe,
    } = await supabase
      .from(
        'recipes',
      )
      .select(`
        id
      `)
      .eq(
        'product_id',
        approval.reference_id,
      )
      .eq(
        'is_active',
        true,
      )
      .single();

    if (
      recipe &&
      Number(
        forecast?.suggested_production,
      ) > 0
    ) {
      await supabase
        .from(
          'production_orders',
        )
        .insert({
          recipe_id:
            recipe.id,

          planned_quantity:
            Number(
              forecast.suggested_production,
            ),

          produced_quantity:
            0,

          status:
            'draft',

          notes:
            'Generada desde aprobación automática',
        });
    }
  }

  revalidatePath(
    '/approvals',
  );

  revalidatePath(
    '/production-orders',
  );
}

export async function reject(
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
        'rejected',

      rejected_at:
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
