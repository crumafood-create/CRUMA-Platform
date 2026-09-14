import Link from 'next/link';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

import { generatePurchaseRequisition } from './actions';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  pending_approval: 'Pendiente de aprobación',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  converted: 'Convertida',
  cancelled: 'Cancelada',
};

export default async function PurchaseRequisitionsPage() {
  const supabase = await createTypedClient();
  const { data: requisitions, error } = await supabase
    .from('purchase_requisitions')
    .select('id, requisition_number, status, created_at')
    .order('created_at', { ascending: false });
  if (error) throw new Error('No fue posible consultar las requisiciones.');

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-4xl font-bold">Solicitudes de compra</h1>
          <p className="text-sm text-gray-500">Faltantes MRP sujetos a revisión y aprobación.</p>
        </div>
        <form action={generatePurchaseRequisition}>
          <button className="rounded border px-4 py-2">Generar desde MRP</button>
        </form>
      </div>

      <section className="space-y-3 rounded-2xl border p-6">
        {requisitions?.length ? requisitions.map((requisition) => (
          <article key={requisition.id} className="flex items-center justify-between rounded border p-4">
            <div>
              <div className="font-semibold">{requisition.requisition_number}</div>
              <div className="text-sm text-gray-500">
                {STATUS_LABELS[requisition.status] ?? requisition.status}
              </div>
            </div>
            <Link href={`/purchase-requisitions/${requisition.id}`} className="rounded border px-3 py-1">
              Ver detalle
            </Link>
          </article>
        )) : <p>No hay solicitudes de compra.</p>}
      </section>
    </main>
  );
}
