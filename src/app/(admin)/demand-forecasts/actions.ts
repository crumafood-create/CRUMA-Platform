'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export async function calculateDemandForecasts() {
  const supabase = await createClient();

  //
  // Productos
  //
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select(`
      id,
      name
    `);

  if (productsError) {
    throw new Error(productsError.message);
  }

  for (const product of products ?? []) {
    //
    // Ventas entregadas
    //
    const { data: sales, error: salesError } = await supabase
      .from('sales_order_items')
      .select(`
        quantity,
        sales_orders (
          status,
          created_at
        )
      `)
      .eq('product_id', product.id);

    if (salesError) {
      throw new Error(salesError.message);
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    let sold = 0;

    for (const row of sales ?? []) {
      const order = Array.isArray(row.sales_orders)
        ? row.sales_orders[0]
        : row.sales_orders;

      if (!order) {
        continue;
      }

      if (order.status !== 'delivered') {
        continue;
      }

      const created = new Date(order.created_at);

      if (created < cutoff) {
        continue;
      }

      sold += Number(row.quantity);
    }

    //
    // Promedio diario
    //
    const averageDaily = sold / 30;

    //
    // Pronóstico
    //
    const forecast = averageDaily * 14;

    //
    // Stock
    //
    const { data: stock } = await supabase
      .from('inventory_stock_by_item')
      .select(`
        quantity
      `)
      .eq('item_type', 'product')
      .eq('item_id', product.id)
      .single();

    const stockQuantity = Number(stock?.quantity ?? 0);

    //
    // Producción sugerida
    //
    const suggested = Math.max(forecast - stockQuantity, 0);

    //
    // Guardar
    //
    const { error: upsertError } = await supabase
      .from('demand_forecasts')
      .upsert(
        {
          product_id: product.id,
          period_days: 30,
          average_daily_demand: Number(averageDaily.toFixed(4)),
          forecast_quantity: Number(forecast.toFixed(4)),
          stock_quantity: Number(stockQuantity.toFixed(4)),
          suggested_production: Number(suggested.toFixed(4)),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'product_id,period_days',
        }
      );

    if (upsertError) {
      throw new Error(upsertError.message);
    }
  }

  revalidatePath('/demand-forecasts');
}

export async function createProductionOrderFromForecast(productId: string) {
  const supabase = await createClient();

  //
  // Pronóstico
  //
  const { data: forecast, error: forecastError } = await supabase
    .from('demand_forecasts')
    .select('*')
    .eq('product_id', productId)
    .single();

  if (forecastError || !forecast) {
    throw new Error(
      forecastError?.message ?? 'Pronóstico no encontrado'
    );
  }

  const quantity = Number(forecast.suggested_production ?? 0);

  if (quantity <= 0) {
    throw new Error('No hay producción sugerida.');
  }

  //
  // Buscar receta activa
  //
  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .select(`
      id,
      name
    `)
    .eq('product_id', productId)
    .eq('is_active', true)
    .single();

  if (recipeError || !recipe) {
    throw new Error('El producto no tiene receta activa.');
  }

  //
  // Crear orden
  //
  const { error: productionError } = await supabase
    .from('production_orders')
    .insert({
      recipe_id: recipe.id,
      planned_quantity: quantity,
      produced_quantity: 0,
      production_status: 'draft',
      notes: 'Generada desde Forecast',
    });

  if (productionError) {
    throw new Error(productionError.message);
  }

  revalidatePath('/production-orders');
  revalidatePath('/demand-forecasts');
}

export async function createForecastApprovals() {
  const supabase = await createClient();

  const { data: forecasts, error } = await supabase
    .from('demand_forecasts')
    .select(`
      product_id,
      suggested_production
    `)
    .gt('suggested_production', 0);

  if (error) {
    throw new Error(error.message);
  }

  for (const row of forecasts ?? []) {
    const { data: existing } = await supabase
      .from('approvals')
      .select('id')
      .eq('approval_type', 'production')
      .eq('reference_type', 'product')
      .eq('reference_id', row.product_id)
      .eq('status', 'pending')
      .maybeSingle();

    if (existing) {
      continue;
    }

    await supabase.from('approvals').insert({
      approval_type: 'production',
      reference_type: 'product',
      reference_id: row.product_id,
      title: 'Producción sugerida',
      description: `Producir ${row.suggested_production} unidades.`,
      status: 'pending',
    });
  }

  revalidatePath('/approvals');
}
