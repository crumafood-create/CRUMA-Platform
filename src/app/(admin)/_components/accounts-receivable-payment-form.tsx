'use client';

interface Props {
  action: (
    formData: FormData,
  ) => Promise<void>;

  accountId: string;
}

export function AccountsReceivablePaymentForm({
  action,
  accountId,
}: Props) {
  return (
    <form
      action={action}
      className="space-y-6 rounded-2xl border bg-white p-6"
    >
      <input
        type="hidden"
        name="account_receivable_id"
        value={accountId}
      />

      <div>
        <label className="mb-2 block font-medium">
          Fecha
        </label>

        <input
          type="date"
          name="payment_date"
          defaultValue={
            new Date()
              .toISOString()
              .slice(0, 10)
          }
          className="w-full rounded border p-3"
        />
      </div>

      <div>
        <label className="mb-2 block font-medium">
          Monto
        </label>

        <input
          type="number"
          step="0.01"
          min="0.01"
          name="amount"
          required
          className="w-full rounded border p-3"
        />
      </div>

      <div>
        <label className="mb-2 block font-medium">
          Método de Pago
        </label>

        <input
          name="payment_method"
          className="w-full rounded border p-3"
          placeholder="Transferencia"
        />
      </div>

      <div>
        <label className="mb-2 block font-medium">
          Referencia
        </label>

        <input
          name="reference"
          className="w-full rounded border p-3"
        />
      </div>

      <div>
        <label className="mb-2 block font-medium">
          Notas
        </label>

        <textarea
          name="notes"
          rows={3}
          className="w-full rounded border p-3"
        />
      </div>

      <button
        type="submit"
        className="rounded border px-6 py-2"
      >
        Registrar Pago
      </button>
    </form>
  );
}
