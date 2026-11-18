import Link from 'next/link';

import { closeQualityRetentionDay } from '../actions';
import { createTypedClient } from '@/infrastructure/integrations/supabase/server';
import {
  getQualityRetentionDailyCloses,
  getQualityRetentionMonthlyIndicator,
} from '@/modules/quality/application/quality-retention-repository';

function todayInMexico(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function previousMonth(today: string): string {
  const [yearPart, monthPart] = today.split('-');
  const year = Number(yearPart);
  const month = Number(monthPart);
  const previous = new Date(Date.UTC(year, month - 2, 1));
  return `${previous.getUTCFullYear()}-${String(previous.getUTCMonth() + 1).padStart(2, '0')}`;
}

export default async function QualityRetentionPage({
  searchParams,
}: {
  searchParams?: Promise<{ month?: string; closed?: string }>;
}) {
  const params = await searchParams;
  const today = todayInMexico();
  const defaultMonth = previousMonth(today);
  const requestedMonth = params?.month ?? defaultMonth;
  const month = /^\d{4}-\d{2}$/.test(requestedMonth)
    ? `${requestedMonth}-01`
    : `${defaultMonth}-01`;
  const supabase = await createTypedClient();
  const [dailyCloses, indicators] = await Promise.all([
    getQualityRetentionDailyCloses(supabase),
    getQualityRetentionMonthlyIndicator(supabase, month),
  ]);

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Retención de Calidad</h1>
          <p className="text-sm text-gray-600">
            Cierre diario de muestras en custodia e indicador al cierre mensual.
          </p>
        </div>
        <Link href="/qa" className="rounded border px-4 py-2">Volver a Calidad</Link>
      </div>

      {params?.closed ? (
        <p role="status" className="rounded border border-green-300 p-3 text-green-800">
          Cierre diario registrado para {params.closed}. Repetir el cierre de esa fecha no duplica su registro.
        </p>
      ) : null}

      <section className="space-y-3 rounded-2xl border p-6">
        <h2 className="text-xl font-semibold">Cierre diario</h2>
        <p>Guarda una fotografía de las muestras intactas que siguen en custodia. Cada fecha se cierra una sola vez.</p>
        <form action={closeQualityRetentionDay} className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            Fecha del cierre
            <input name="close_date" type="date" required defaultValue={today} min={today} max={today}
              className="mt-1 block rounded border px-3 py-2" />
          </label>
          <button className="rounded border px-4 py-2" type="submit">Cerrar día</button>
        </form>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr><th className="p-2">Fecha</th><th className="p-2">Muestras en custodia</th><th className="p-2">Cantidad</th><th className="p-2">Registrado</th></tr></thead>
            <tbody>
              {dailyCloses.map((close) => (
                <tr key={close.close_date} className="border-t">
                  <td className="p-2">{close.close_date}</td>
                  <td className="p-2">{close.retained_sample_count}</td>
                  <td className="p-2">{close.retained_quantity} piezas</td>
                  <td className="p-2">{new Date(close.closed_at).toLocaleString('es-MX')}</td>
                </tr>
              ))}
              {!dailyCloses.length ? <tr><td colSpan={4} className="p-2">Aún no hay cierres diarios.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border p-6">
        <div>
          <h2 className="text-xl font-semibold">Indicador mensual de retención</h2>
          <p className="text-sm text-gray-600">
            Custodia intacta al cierre del último día del mes ÷ piezas confirmadas como crudas congeladas de la producción del mismo mes. La merma directa de Calidad se informa por separado.
          </p>
        </div>
        <form method="get" className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            Mes de producción
            <input name="month" type="month" defaultValue={month.slice(0, 7)} required
              className="mt-1 block rounded border px-3 py-2" />
          </label>
          <button className="rounded border px-4 py-2" type="submit">Consultar mes</button>
        </form>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr>
              <th className="p-2">Producto / preparación</th><th className="p-2">Custodia al cierre</th>
              <th className="p-2">Producción bruta</th><th className="p-2">Retención</th>
              <th className="p-2">Merma directa de Calidad</th><th className="p-2">Meta</th>
              <th className="p-2">Estado del cierre</th>
            </tr></thead>
            <tbody>
              {indicators.map((item) => (
                <tr key={`${item.product_id}:${item.preparation_type_id ?? 'none'}`} className="border-t">
                  <td className="p-2">{item.product_name} · {item.preparation_name ?? 'Sin preparación'}</td>
                  <td className="p-2">{item.month_closed ? `${item.retained_quantity} piezas` : 'Pendiente de cierre'}</td>
                  <td className="p-2">{item.gross_production_quantity} piezas</td>
                  <td className="p-2">{!item.month_closed ? 'Pendiente de cierre' : item.retention_percentage === null ? 'Sin denominador' : `${item.retention_percentage.toFixed(4)}%`}</td>
                  <td className="p-2">{item.direct_quality_waste_quantity} piezas</td>
                  <td className="p-2">{!item.month_closed || item.retention_percentage === null ? 'Pendiente' : item.retention_percentage < 0.1 || item.retention_percentage > 0.5 ? 'Revisar desviación' : 'Dentro de meta'}</td>
                  <td className="p-2">{item.month_closed ? 'Cierre mensual registrado' : 'Falta el cierre del último día'}</td>
                </tr>
              ))}
              {!indicators.length ? <tr><td colSpan={7} className="p-2">No hay producción ni muestras registradas para este mes.</td></tr> : null}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500">Meta de referencia acordada: 0.1%–0.5%. Los datos se presentan por producto y preparación; la merma no se suma a las muestras en custodia.</p>
      </section>
    </main>
  );
}
