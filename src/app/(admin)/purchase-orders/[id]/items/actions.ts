'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export async function createPurchaseOrderItem(
  formData: FormData
) {
  const supabase =
    await createClient();

  const purchaseOrderId =
    String(
      formData.get(
        'purchase_order_id'
      )
    );

  const quantity =
    Number(
      formData.get('quantity')
    );

  const unitCost =
    Number(
      formData.get('unit_cost')
    );

  const total =
    quantity * unitCost;

  const { error } =
    await supabase
      .from(
        'purchase_order_items'
      )
      .insert({
        purchase_order_id:
          purchaseOrderId,

        raw_material_id:
          formData.get(
            'raw_material_id'
          ),

        quantity,
        unit_cost: unitCost,
        total,
      });

  if (error) {
    throw new Error(
      error.message
    );
  }

  revalidatePath(
    `/purchase-orders/${purchaseOrderId}/items`
  );
}
