import { issueInvoice } from '@/app/(admin)/invoices/actions';

export function InvoiceIssueForm({ salesOrderId }: { salesOrderId: string }) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <form action={issueInvoice} className="space-y-4 rounded-2xl border p-6">
      <input type="hidden" name="sales_order_id" value={salesOrderId} />
      <h2 className="text-xl font-semibold">Emitir factura comercial</h2>
      <p className="text-sm text-gray-600">
        Se copiarán los datos y partidas del pedido. Este comprobante no es un CFDI.
      </p>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Fecha de vencimiento</span>
        <input
          type="date"
          name="due_date"
          min={today}
          className="block rounded border px-3 py-2"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Notas</span>
        <textarea name="notes" rows={3} className="block w-full rounded border px-3 py-2" />
      </label>
      <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
        Emitir factura
      </button>
    </form>
  );
}
