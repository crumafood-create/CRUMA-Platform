import Link from 'next/link';

import { parseBusinessReportPeriod } from '@/modules/analytics/application/business-report-period';
import { loadBusinessReport } from '@/modules/analytics/application/business-report-repository';
import { requireTypedAuthorizedAction } from '@/modules/identity/guards/action.guard';
import { PERMISSIONS } from '@/modules/identity/permissions/permissions.constants';
import { Button } from '@/shared/ui/primitives/button';
import { Card, CardContent } from '@/shared/ui/primitives/card';

type ReportsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const value = (input: string | string[] | undefined) => Array.isArray(input) ? input[0] : input;
const money = (amount: number) => new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
}).format(amount);

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = await searchParams;
  const period = parseBusinessReportPeriod({
    from: value(params.from),
    to: value(params.to),
  });
  const { supabase } = await requireTypedAuthorizedAction(PERMISSIONS.BUSINESS_REPORT_VIEW);
  const report = await loadBusinessReport(supabase, period);
  const exportQuery = new URLSearchParams(period).toString();

  return (
    <main className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-blue">Producto y crecimiento</p>
          <h1 className="mt-2 text-3xl font-black text-brand-black">Reporte ejecutivo</h1>
          <p className="mt-1 text-sm text-brand-gray-75">Ventas, inventario, producción y adopción en un periodo común.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/reports/export?${exportQuery}&format=csv`}><Button variant="secondary">Descargar CSV</Button></Link>
          <Link href={`/reports/export?${exportQuery}&format=pdf`}><Button>Descargar PDF</Button></Link>
        </div>
      </header>

      <Card><CardContent>
        <form method="get" className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]" aria-label="Periodo del reporte">
          <label className="text-sm font-bold">Desde<input required type="date" name="from" defaultValue={period.from} className="mt-2 min-h-12 w-full rounded-xl border px-3 focus-visible:ring-2 focus-visible:ring-brand-blue" /></label>
          <label className="text-sm font-bold">Hasta<input required type="date" name="to" defaultValue={period.to} className="mt-2 min-h-12 w-full rounded-xl border px-3 focus-visible:ring-2 focus-visible:ring-brand-blue" /></label>
          <Button type="submit" className="self-end">Actualizar</Button>
        </form>
      </CardContent></Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Indicadores ejecutivos">
        {[
          ['Ingresos', money(report.kpis.revenue)],
          ['Unidades vendidas', report.kpis.unitsSold],
          ['SKU críticos', report.kpis.lowStockSkus],
          ['Eficiencia productiva', `${report.kpis.productionEfficiency}%`],
          ['Usuarios activos', report.kpis.activeUsers],
          ['SKU monitoreados', report.kpis.trackedSkus],
        ].map(([label, metric]) => <Card key={label}><CardContent><p className="text-sm text-brand-gray-50">{label}</p><p className="mt-2 text-3xl font-black">{metric}</p></CardContent></Card>)}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <ReportTable title="Ventas por línea" empty="No hubo ventas en el periodo." headings={['Línea', 'Unidades', 'Ingresos']} rows={report.salesByLine.map((line) => [line.name, line.units, money(line.revenue)])} />
        <ReportTable title="Inventario por SKU" empty="No hay inventario registrado." headings={['SKU', 'Artículo', 'Existencia']} rows={report.inventoryBySku.slice(0, 10).map((item) => [item.sku, item.name, `${item.quantity}${item.status === 'healthy' ? '' : ' · Atención'}`])} />
        <ReportTable title="Producción" empty="No hubo órdenes en el periodo." headings={['Planeado', 'Producido', 'Completadas']} rows={report.production.totalOrders ? [[report.production.planned, report.production.produced, `${report.production.completedOrders}/${report.production.totalOrders}`]] : []} />
        <ReportTable title="Uso de la plataforma" empty="Aún no hay eventos en el periodo." headings={['Página', 'Vistas', 'Sesiones']} rows={report.userBehavior.topPages.map((page, index) => [page.page, page.views, index === 0 ? report.userBehavior.sessions : ''])} />
      </div>
    </main>
  );
}

function ReportTable({ title, empty, headings, rows }: {
  title: string;
  empty: string;
  headings: string[];
  rows: Array<Array<string | number>>;
}) {
  return <Card><CardContent><h2 className="text-xl font-black">{title}</h2>{rows.length ? <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{headings.map((heading) => <th key={heading} scope="col" className="border-b p-3">{heading}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={`${title}-${rowIndex}`}>{row.map((cell, index) => <td key={`${title}-${rowIndex}-${headings[index]}`} className="border-b p-3">{cell}</td>)}</tr>)}</tbody></table></div> : <p className="mt-4 rounded-xl bg-brand-gray-25 p-6 text-center text-sm text-brand-gray-75">{empty}</p>}</CardContent></Card>;
}
