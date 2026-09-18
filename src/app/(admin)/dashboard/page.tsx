import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';
import { requireRows } from '@/modules/core/application/critical-read';

function money(value: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(value);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Mantenemos tu óptima consulta paralela a la base de datos
  const [
    salesResult,
    receivablesResult,
    stockResult,
    productionResult,
    forecastsResult,
  ] = await Promise.all([
    supabase
      .from('sales_orders')
      .select('total, created_at')
      .gte('created_at', firstDay)
      .eq('status', 'delivered'),

    supabase
      .from('accounts_receivable')
      .select('balance, status')
      .eq('status', 'pending'),

    supabase
      .from('inventory_stock_by_item')
      .select('item_type, quantity'),

    supabase
      .from('production_orders')
      .select('production_status'),

    supabase
      .from('demand_forecasts')
      .select('suggested_production'),
  ]);

  const sales = requireRows(salesResult, 'indicadores del dashboard');
  const receivables = requireRows(
    receivablesResult,
    'indicadores del dashboard',
  );
  const stock = requireRows(stockResult, 'indicadores del dashboard');
  const production = requireRows(
    productionResult,
    'indicadores del dashboard',
  );
  const forecasts = requireRows(
    forecastsResult,
    'indicadores del dashboard',
  );

  // Lógica matemática exacta conservada
  const salesMonth = (sales ?? []).reduce((sum, row) => sum + Number(row.total ?? 0), 0);
  const receivableBalance = (receivables ?? []).reduce((sum, row) => sum + Number(row.balance ?? 0), 0);
  
  const productCount = (stock ?? []).filter(
    (row) => row.item_type === 'product' && Number(row.quantity) > 0
  ).length;

  const materialCount = (stock ?? []).filter(
    (row) => row.item_type === 'raw_material' && Number(row.quantity) > 0
  ).length;

  const criticalCount = (stock ?? []).filter((row) => Number(row.quantity) <= 0).length;

  const openProduction = (production ?? []).filter(
    (row) => row.production_status !== 'completed' && row.production_status !== 'cancelled'
  ).length;

  const completedProduction = (production ?? []).filter((row) => row.production_status === 'completed').length;
  const productsToProduce = (forecasts ?? []).filter((row) => Number(row.suggested_production) > 0).length;
  const suggestedProduction = (forecasts ?? []).reduce((sum, row) => sum + Number(row.suggested_production ?? 0), 0);

  // Mapeamos tus tarjetas con semántica de color e iconos para los KPIs profesionales
  const cards = [
    { title: 'Ventas del Mes', value: money(salesMonth), icon: '💰', color: 'text-green-600 bg-green-50' },
    { title: 'Por Cobrar', value: money(receivableBalance), icon: '⏳', color: 'text-amber-600 bg-amber-50' },
    { title: 'Productos con Stock', value: productCount.toString(), icon: '📦', color: 'text-brand-blue bg-brand-blue/10' },
    { title: 'Materias Primas', value: materialCount.toString(), icon: '🌾', color: 'text-brand-black bg-brand-sand/20' },
    { title: 'Materiales Críticos', value: criticalCount.toString(), icon: '⚠️', color: criticalCount > 0 ? 'text-red-600 bg-red-50' : 'text-brand-gray-50 bg-brand-gray-25' },
    { title: 'Órdenes Abiertas', value: openProduction.toString(), icon: '🏭', color: 'text-indigo-600 bg-indigo-50' },
    { title: 'Órdenes Completadas', value: completedProduction.toString(), icon: '✅', color: 'text-emerald-600 bg-emerald-50' },
    { title: 'Productos por Producir', value: productsToProduce.toString(), icon: '📈', color: 'text-brand-blue bg-brand-blue/10' },
    { title: 'Producción Sugerida', value: `${suggestedProduction.toFixed(0)} pzas`, icon: '📊', color: 'text-brand-gray-75 bg-brand-gray-25' },
  ];

  return (
    <main className="space-y-8 font-arkibal">
      {/* Encabezado */}
      <div className="border-b border-brand-gray-25 pb-4">
        <h1 className="text-3xl font-black text-brand-black tracking-tight">
          Dashboard Ejecutivo
        </h1>
        <p className="mt-1 text-sm text-brand-gray-75 font-light">
          Resumen general consolidado de la operación de CRUMAFOOD.
        </p>
      </div>

      {/* Grid de KPIs - Tarjetas maestras */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.title} className="rounded-2xl border border-brand-gray-25 bg-white p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-brand-gray-75 leading-tight">
                {card.title}
              </span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${card.color}`}>
                {card.icon}
              </div>
            </div>
            <div className="text-2xl font-black text-brand-black tracking-tight">
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Bloque de Accesos a Módulos y Alertas Integradas */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Enlaces de Módulos (2/3 de ancho) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-black text-brand-black">Módulos del Sistema</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link href="/sales-orders" className="group rounded-2xl border border-brand-gray-25 bg-white p-5 flex items-center justify-between hover:border-brand-blue hover:shadow-sm transition-all">
              <span className="font-bold text-brand-black group-hover:text-brand-blue transition-colors">🛒 Ventas / Pedidos</span>
              <span className="text-brand-gray-50 group-hover:translate-x-1 transition-transform">→</span>
            </Link>

            <Link href="/production-orders" className="group rounded-2xl border border-brand-gray-25 bg-white p-5 flex items-center justify-between hover:border-brand-blue hover:shadow-sm transition-all">
              <span className="font-bold text-brand-black group-hover:text-brand-blue transition-colors">🏭 Órdenes de Producción</span>
              <span className="text-brand-gray-50 group-hover:translate-x-1 transition-transform">→</span>
            </Link>

            <Link href="/inventory-stock" className="group rounded-2xl border border-brand-gray-25 bg-white p-5 flex items-center justify-between hover:border-brand-blue hover:shadow-sm transition-all">
              <span className="font-bold text-brand-black group-hover:text-brand-blue transition-colors">📦 Control de Inventario</span>
              <span className="text-brand-gray-50 group-hover:translate-x-1 transition-transform">→</span>
            </Link>

            <Link href="/demand-forecasts" className="group rounded-2xl border border-brand-gray-25 bg-white p-5 flex items-center justify-between hover:border-brand-blue hover:shadow-sm transition-all">
              <span className="font-bold text-brand-black group-hover:text-brand-blue transition-colors">📈 Proyección de Demanda</span>
              <span className="text-brand-gray-50 group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </div>

        {/* Panel Lateral de Notificaciones/Alertas Críticas (1/3 de ancho) */}
        <div className="space-y-4">
          <h2 className="text-lg font-black text-brand-black">Alertas Operativas</h2>
          <div className="rounded-2xl border border-brand-gray-25 bg-white p-6 shadow-sm space-y-3">
            {criticalCount === 0 && productsToProduce === 0 && receivableBalance === 0 ? (
              <p className="text-xs text-brand-gray-50 font-light text-center py-4">✅ Operación sin incidencias críticas.</p>
            ) : (
              <>
                {criticalCount > 0 && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 font-medium">
                    ⚠️ Hay <strong className="font-black">{criticalCount}</strong> materiales sin stock disponible.
                  </div>
                )}

                {productsToProduce > 0 && (
                  <div className="rounded-xl border border-brand-sand/40 bg-brand-sand/10 p-3 text-xs text-brand-black font-medium">
                    📈 Hay <strong className="font-black">{productsToProduce}</strong> productos que requieren producción inmediata.
                  </div>
                )}

                {receivableBalance > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 font-medium">
                    💰 Existen <strong className="font-black">{money(receivableBalance)}</strong> pendientes por cobrar.
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
