import Link from 'next/link';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';
import { loadDashboardSummary } from '@/modules/analytics/application/dashboard-repository';
import { Card, CardContent } from '@/shared/ui/primitives/card';

function money(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(value);
}

export default async function DashboardPage() {
  const client = await createTypedClient();
  const summary = await loadDashboardSummary(client);
  const {
    salesMonth,
    receivableBalance,
    productCount,
    materialCount,
    criticalCount,
    openProduction,
    completedProduction,
    productsToProduce,
    suggestedProduction,
  } = summary;

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
  const modules = [
    ['/sales-orders', '🛒 Ventas / Pedidos'],
    ['/production-orders', '🏭 Órdenes de Producción'],
    ['/inventory-stock', '📦 Control de Inventario'],
    ['/demand-forecasts', '📈 Proyección de Demanda'],
  ] as const;

  return (
    <main className="space-y-8 font-arkibal">
      <div className="border-b border-brand-gray-25 pb-4">
        <h1 className="text-3xl font-black tracking-tight text-brand-black">Dashboard Ejecutivo</h1>
        <p className="mt-1 text-sm font-light text-brand-gray-75">Resumen general consolidado de la operación de CRUMAFOOD.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardContent className="flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black uppercase leading-tight tracking-wider text-brand-gray-75">{card.title}</span>
                <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-sm ${card.color}`}>{card.icon}</div>
              </div>
              <div className="text-2xl font-black tracking-tight text-brand-black">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-4 lg:col-span-2">
          <h2 className="text-lg font-black text-brand-black">Módulos del Sistema</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {modules.map(([href, label]) => (
              <Link key={href} href={href} className="group flex items-center justify-between rounded-2xl border border-brand-gray-25 bg-white p-5 transition-all hover:border-brand-blue hover:shadow-sm">
                <span className="font-bold text-brand-black transition-colors group-hover:text-brand-blue">{label}</span>
                <span className="text-brand-gray-50 transition-transform group-hover:translate-x-1">→</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-black text-brand-black">Alertas Operativas</h2>
          <Card>
            <CardContent className="space-y-3">
              {criticalCount === 0 && productsToProduce === 0 && receivableBalance === 0 ? (
                <p className="py-4 text-center text-xs font-light text-brand-gray-50">✅ Operación sin incidencias críticas.</p>
              ) : (
                <>
                  {criticalCount > 0 ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-800">⚠️ Hay <strong className="font-black">{criticalCount}</strong> materiales sin stock disponible.</div> : null}
                  {productsToProduce > 0 ? <div className="rounded-xl border border-brand-sand/40 bg-brand-sand/10 p-3 text-xs font-medium text-brand-black">📈 Hay <strong className="font-black">{productsToProduce}</strong> productos que requieren producción inmediata.</div> : null}
                  {receivableBalance > 0 ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-800">💰 Existen <strong className="font-black">{money(receivableBalance)}</strong> pendientes por cobrar.</div> : null}
                </>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
