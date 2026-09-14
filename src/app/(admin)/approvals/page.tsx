import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

import { createPurchaseApprovals, decideApproval } from './actions';

export default async function ApprovalsPage() {
  const supabase = await createTypedClient();
  const { data: approvals, error } = await supabase
    .from('approvals')
    .select('id, title, description, approval_type, reference_type, status, created_at')
    .order('created_at', { ascending: false });
  if (error) throw new Error('No fue posible consultar las aprobaciones.');

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-4xl font-bold">Aprobaciones</h1>
          <p className="text-sm text-gray-500">Decisiones registradas una sola vez y con trazabilidad.</p>
        </div>
        <form action={createPurchaseApprovals}>
          <button className="rounded border px-4 py-2">Detectar compras por mínimo</button>
        </form>
      </div>

      <section className="space-y-3">
        {approvals?.map((approval) => (
          <article key={approval.id} className="rounded border p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="font-semibold">{approval.title}</div>
                <div className="text-sm text-gray-500">{approval.description}</div>
                <div className="mt-1 text-xs text-gray-500">
                  {approval.approval_type} · {approval.reference_type} · {approval.status}
                </div>
              </div>
              {approval.status === 'pending' && (
                <div className="flex gap-2">
                  <form action={decideApproval.bind(null, approval.id, 'approved')}>
                    <button className="rounded border px-4 py-2">Aprobar</button>
                  </form>
                  <form action={decideApproval.bind(null, approval.id, 'rejected')}>
                    <button className="rounded border border-red-300 px-4 py-2 text-red-700">Rechazar</button>
                  </form>
                </div>
              )}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
