import Link from 'next/link';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';
import { parseDashboardFilters } from '@/modules/analytics/application/dashboard-filters';
import { loadDashboardFilterOptions, loadDashboardSummary } from '@/modules/analytics/application/dashboard-repository';
import { rankInventoryAlerts } from '@/modules/inventory/application/inventory-alert-contract';
import { fetchInventoryAlerts } from '@/modules/inventory/application/inventory-alert-repository';
import { Button } from '@/shared/ui/primitives/button';
import { Card, CardContent } from '@/shared/ui/primitives/card';

function money(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value);
}

type DashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function value(params: Record<string, string | string[] | undefined>, key: string) {
  const current = params[key];
  return Array.isArray(current) ? current[0] : current;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const filters = parseDashboardFilters({
    period: value(params, 'period'),
    from: value(params, 'from'),
    to: value(params, 'to'),
    user: value(params, 'user'),
    warehouse: value(params, 'warehouse'),
  });
  const client = await createTypedClient();
  const [summary, inventoryAlerts, options] = await Promise.all([
    loadDashboardSummary(client, filters),
    fetchInventoryAlerts(client, filters.warehouseId),
    loadDashboardFilterOptions(client),
  ]);
  const alerts = rankInventoryAlerts(inventoryAlerts);
  const { warehouses, profiles } = options;
  const primaryMetrics = [
    { label: 'Ventas entregadas', value: money(summary.salesMonth), hint: 'En el periodo seleccionado' },
    { label: 'Cartera pendiente', value: money(summary.receivableBalance), hint: 'Saldo por cobrar actual' },
    { label: 'Producción abierta', value: summary.openProduction.toString(), hint: `${summary.delayedProduction} con atraso` },
    { label: 'Producción sugerida', value: `${summary.suggestedProduction.toFixed(0)} pzas`, hint: `${summary.productsToProduce} productos` },
  ];

  return (
    <main className="space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-brand-gray-25 pb-5">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-blue">Centro de mando</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-brand-black">Resumen ejecutivo</h1>
          <p className="mt-1 text-sm text-brand-gray-75">Decisiones rápidas con ventas, inventario y producción en un solo lugar.</p>
        </div>
        <Link href="/sales-orders/new"><Button>Nueva venta</Button></Link>
      </header>

      <Card>
        <CardContent>
          <form method="get" className="grid gap-4 md:grid-cols-2 xl:grid-cols-5" aria-label="Filtros del dashboard">
            <label className="text-sm font-bold text-brand-black">Periodo
              <select name="period" defaultValue={filters.period} className="mt-2 min-h-11 w-full rounded-lg border border-brand-gray-50/40 px-3 font-normal">
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
                <option value="90d">Últimos 90 días</option>
                <option value="custom">Personalizado</option>
              </select>
            </label>
            <label className="text-sm font-bold text-brand-black">Desde
              <input type="date" name="from" defaultValue={value(params, 'from')} className="mt-2 min-h-11 w-full rounded-lg border border-brand-gray-50/40 px-3 font-normal" />
            </label>
            <label className="text-sm font-bold text-brand-black">Hasta
              <input type="date" name="to" defaultValue={value(params, 'to')} className="mt-2 min-h-11 w-full rounded-lg border border-brand-gray-50/40 px-3 font-normal" />
            </label>
            <label className="text-sm font-bold text-brand-black">Responsable
              <select name="user" defaultValue={filters.userId ?? ''} className="mt-2 min-h-11 w-full rounded-lg border border-brand-gray-50/40 px-3 font-normal">
                <option value="">Todos</option>
                {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.full_name ?? profile.email ?? 'Usuario'}</option>)}
              </select>
            </label>
            <label className="text-sm font-bold text-brand-black">Almacén / tienda
              <select name="warehouse" defaultValue={filters.warehouseId ?? ''} className="mt-2 min-h-11 w-full rounded-lg border border-brand-gray-50/40 px-3 font-normal">
                <option value="">Todos</option>
                {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
              </select>
            </label>
            <div className="flex items-end gap-2 xl:col-start-5">
              <Button type="submit" fullWidth>Aplicar filtros</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <section aria-labelledby="metrics-heading">
        <h2 id="metrics-heading" className="sr-only">Indicadores principales</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {primaryMetrics.map((metric) => (
            <Card key={metric.label}>
              <CardContent>
                <p className="text-xs font-black uppercase tracking-wider text-brand-gray-75">{metric.label}</p>
                <p className="mt-3 text-3xl font-black tracking-tight text-brand-black">{metric.value}</p>
                <p className="mt-2 text-sm text-brand-gray-50">{metric.hint}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section aria-labelledby="alerts-heading">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="alerts-heading" className="text-xl font-black text-brand-black">Atención requerida</h2>
            <Link href="/inventory/alerts" className="text-sm font-bold text-brand-blue">Ver todas →</Link>
          </div>
          <Card>
            <CardContent className="space-y-3">
              {summary.delayedProduction > 0 ? (
                <Link href="/production-orders?priority=delayed" className="block rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                  <strong>{summary.delayedProduction} órdenes de producción atrasadas.</strong> Revisar prioridad y fecha planeada.
                </Link>
              ) : null}
              {alerts.slice(0, 4).map((alert) => (
                <Link key={`${alert.item_type}-${alert.item_id}`} href={`/inventory/kardex/${alert.item_type}/${alert.item_id}`} className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                  <span><strong>{alert.name}</strong><span className="block text-xs">Faltan {alert.shortage} para alcanzar el mínimo.</span></span>
                  <span className="font-black">{alert.quantity} / {alert.minimum}</span>
                </Link>
              ))}
              {summary.delayedProduction === 0 && alerts.length === 0 ? <p className="py-8 text-center text-sm text-brand-gray-75">Operación sin incidencias críticas.</p> : null}
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="operation-heading">
          <h2 id="operation-heading" className="mb-3 text-xl font-black text-brand-black">Pulso operativo</h2>
          <Card><CardContent className="space-y-4 text-sm">
            <div className="flex justify-between"><span>Productos con existencia</span><strong>{summary.productCount}</strong></div>
            <div className="flex justify-between"><span>Materias primas con existencia</span><strong>{summary.materialCount}</strong></div>
            <div className="flex justify-between"><span>Órdenes completadas</span><strong>{summary.completedProduction}</strong></div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link href="/inventory-stock" className="rounded-lg bg-brand-gray-25 p-3 text-center font-bold text-brand-black">Inventario</Link>
              <Link href="/production-orders" className="rounded-lg bg-brand-gray-25 p-3 text-center font-bold text-brand-black">Producción</Link>
            </div>
          </CardContent></Card>
        </section>
      </div>
    </main>
  );
}
