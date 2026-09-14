import Link from 'next/link';
import { notFound } from 'next/navigation';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

import { convertToPurchaseOrders, requestPurchaseRequisitionApproval } from '../actions';

export default async function PurchaseRequisitionPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createTypedClient();
  const { data: requisition, error } = await supabase
    .from('purchase_requisitions')
    .select('id, requisition_number, status, notes, requested_by, approved_by, created_at')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error('No fue posible consultar la requisición.');
  if (!requisition) notFound();

  const { data: items, error: itemError } = await supabase
    .from('purchase_requisition_items')
    .select('id, required_quantity, available_quantity, purchase_quantity, raw_materials(name)')
    .eq('purchase_requisition_id', id)
    .order('created_at');
  if (itemError) throw new Error('No fue posible consultar los materiales solicitados.');

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">{requisition.requisition_number}</h1>
          <p className="text-sm text-gray-500">Estado: {requisition.status}</p>
        </div>
        <Link href="/purchase-requisitions" className="rounded border px-4 py-2">Volver</Link>
      </div>

      <section className="rounded-2xl border p-6">
        <h2 className="mb-4 text-xl font-semibold">Materiales</h2>
        <div className="space-y-3">
          {items?.map((item) => (
            <article key={item.id} className="grid gap-2 rounded border p-3 md:grid-cols-4">
              <strong>{item.raw_materials?.name ?? 'Materia prima'}</strong>
              <span>Requerido: {item.required_quantity}</span>
              <span>Disponible: {item.available_quantity}</span>
              <span className="font-semibold text-red-600">Comprar: {item.purchase_quantity}</span>
            </article>
          ))}
        </div>
      </section>

      <div className="flex gap-3">
        {requisition.status === 'draft' && (
          <form action={requestPurchaseRequisitionApproval.bind(null, id)}>
            <button className="rounded border px-4 py-2">Enviar a aprobación</button>
          </form>
        )}
        {requisition.status === 'approved' && (
          <form action={convertToPurchaseOrders.bind(null, id)}>
            <button className="rounded border px-4 py-2">Crear órdenes por proveedor</button>
          </form>
        )}
      </div>
    </main>
  );
}
