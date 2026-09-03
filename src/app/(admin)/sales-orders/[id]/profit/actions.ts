'use server';

import { revalidatePath } from 'next/cache';

import { requireTypedAuthorizedAction } from '@/lib/auth/guards/action.guard';
import { PERMISSIONS } from '@/lib/auth/permissions/permissions.constants';

export async function calculateSalesOrderProfit(
  orderId: string,
) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.SALES_ORDER_PROFIT_CALCULATE,
  );

  const { data: order } =
    await supabase
      .from('sales_orders')
      .select(`
        id,
        total
      `)
      .eq('id', orderId)
      .single();

  if (!order) {
    throw new Error(
      'Pedido no encontrado',
    );
  }

  const { data: items } =
    await supabase
      .from(
        'sales_order_items',
      )
      .select(`
        quantity,
        products (
          id,
          average_cost
        )
      `)
      .eq(
        'sales_order_id',
        orderId,
      );

  let costAmount = 0;

  for (const item of items ?? []) {
    const product =
      Array.isArray(
        item.products,
      )
        ? item.products[0]
        : item.products;

    const averageCost =
      Number(
        product
          ?.average_cost ?? 0,
      );

    costAmount +=
      Number(
        item.quantity,
      ) *
      averageCost;
  }

  const salesAmount =
    Number(order.total);

  const grossProfit =
    salesAmount -
    costAmount;

  const marginPercent =
    salesAmount > 0
      ? (
          (grossProfit /
            salesAmount) *
          100
        )
      : 0;

  const {
    data: existing,
  } = await supabase
    .from(
      'sales_order_profit',
    )
    .select('id')
    .eq(
      'sales_order_id',
      orderId,
    )
    .maybeSingle();

  if (existing) {
    const { error } =
      await supabase
        .from(
          'sales_order_profit',
        )
        .update({
          sales_amount:
            Number(
              salesAmount.toFixed(
                2,
              ),
            ),

          cost_amount:
            Number(
              costAmount.toFixed(
                2,
              ),
            ),

          gross_profit:
            Number(
              grossProfit.toFixed(
                2,
              ),
            ),

          margin_percent:
            Number(
              marginPercent.toFixed(
                2,
              ),
            ),

          updated_at:
            new Date().toISOString(),

          calculated_at:
            new Date().toISOString(),
        })
        .eq(
          'sales_order_id',
          orderId,
        );

    if (error) {
      throw new Error(
        error.message,
      );
    }
  } else {
    const { error } =
      await supabase
        .from(
          'sales_order_profit',
        )
        .insert({
          sales_order_id:
            orderId,

          sales_amount:
            Number(
              salesAmount.toFixed(
                2,
              ),
            ),

          cost_amount:
            Number(
              costAmount.toFixed(
                2,
              ),
            ),

          gross_profit:
            Number(
              grossProfit.toFixed(
                2,
              ),
            ),

          margin_percent:
            Number(
              marginPercent.toFixed(
                2,
              ),
            ),
        });

    if (error) {
      throw new Error(
        error.message,
      );
    }
  }

  revalidatePath(
    `/sales-orders/${orderId}`,
  );

  revalidatePath(
    `/sales-orders/${orderId}/profit`,
  );
}
