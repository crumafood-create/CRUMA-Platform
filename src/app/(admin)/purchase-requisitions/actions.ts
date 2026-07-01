'use server';

import crypto from 'crypto';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/infrastructure/integrations/supabase/server';

function generateNumber() {
  const date = new Date();

  const yyyy =
    date.getFullYear();

  const mm = String(
    date.getMonth() + 1,
  ).padStart(2, '0');

  const dd = String(
    date.getDate(),
  ).padStart(2, '0');

  const random =
    crypto
      .randomUUID()
      .slice(0, 6)
      .toUpperCase();

  return `RQ-${yyyy}${mm}${dd}-${random}`;
}

export async function generatePurchaseRequisition() {
  const supabase =
    await createClient();

  const { data: requirements } =
    await supabase
      .from(
        'mrp_purchase_requirements',
      )
      .select('*');

  if (
    !requirements ||
    requirements.length === 0
  ) {
    throw new Error(
      'No hay faltantes por comprar.',
    );
  }

  const {
    data: requisition,
    error,
  } = await supabase
    .from(
      'purchase_requisitions',
    )
    .insert({
      requisition_number:
        generateNumber(),

      status: 'draft',
    })
    .select()
    .single();

  if (
    error ||
    !requisition
  ) {
    throw new Error(
      error?.message,
    );
  }

  const items =
    requirements.map(
      (item) => ({
        purchase_requisition_id:
          requisition.id,

        raw_material_id:
          item.raw_material_id,

        required_quantity:
          item.required_quantity,

        available_quantity:
          item.available_quantity,

        purchase_quantity:
          item.purchase_quantity,
      }),
    );

  const {
    error: itemsError,
  } = await supabase
    .from(
      'purchase_requisition_items',
    )
    .insert(items);

  if (itemsError) {
    throw new Error(
      itemsError.message,
    );
  }

  revalidatePath(
    '/purchase-requisitions',
  );

  redirect(
    `/purchase-requisitions/${requisition.id}`,
  );
}

export async function approvePurchaseRequisition(
  requisitionId: string,
) {
  const supabase =
    await createClient();

  const { error } =
    await supabase
      .from(
        'purchase_requisitions',
      )
      .update({
        status:
          'approved',

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        'id',
        requisitionId,
      );

  if (error) {
    throw new Error(
      error.message,
    );
  }

  revalidatePath(
    '/purchase-requisitions',
  );

  revalidatePath(
    `/purchase-requisitions/${requisitionId}`,
  );
}

export async function convertToPurchaseOrder(
  requisitionId: string,
) {
  const supabase =
    await createClient();

  const {
    data: requisition,
  } = await supabase
    .from(
      'purchase_requisitions',
    )
    .select('*')
    .eq(
      'id',
      requisitionId,
    )
    .single();

  if (
    !requisition
  ) {
    throw new Error(
      'Requisición no encontrada',
    );
  }

  const {
    data: items,
  } = await supabase
    .from(
      'purchase_requisition_items',
    )
    .select('*')
    .eq(
      'purchase_requisition_id',
      requisitionId,
    );

  if (
    !items?.length
  ) {
    throw new Error(
      'La requisición no tiene materiales.',
    );
  }

  const {
    data: order,
    error,
  } = await supabase
    .from(
      'purchase_orders',
    )
    .insert({
      order_number:
        `PO-${Date.now()}`,

      status:
        'draft',

      subtotal: 0,
      total: 0,
    })
    .select()
    .single();

  if (
    error ||
    !order
  ) {
    throw new Error(
      error?.message,
    );
  }

  const orderItems =
    items.map(
      (
        item,
      ) => ({
        purchase_order_id:
          order.id,

        raw_material_id:
          item.raw_material_id,

        quantity:
          item.purchase_quantity,

        received_quantity: 0,

        unit_cost: 0,

        total_cost: 0,
      }),
    );

  const {
    error: itemsError,
  } = await supabase
    .from(
      'purchase_order_items',
    )
    .insert(
      orderItems,
    );

  if (
    itemsError
  ) {
    throw new Error(
      itemsError.message,
    );
  }

  await supabase
    .from(
      'purchase_requisitions',
    )
    .update({
      status:
        'converted',

      updated_at:
        new Date().toISOString(),
    })
    .eq(
      'id',
      requisitionId,
    );

  revalidatePath(
    '/purchase-orders',
  );

  revalidatePath(
    '/purchase-requisitions',
  );

  redirect(
    `/purchase-orders/${order.id}`,
  );
}
