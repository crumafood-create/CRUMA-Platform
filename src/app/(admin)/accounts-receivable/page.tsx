import Link from 'next/link';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';
import { requireRows } from '@/modules/core/application/critical-read';

export default async function AccountsReceivablePage() {
  const supabase = await createTypedClient();

  const result = await supabase
    .from(
      'accounts_receivable',
    )
    .select('id, document_number, amount, paid_amount, balance, status')
    .order(
      'created_at',
      {
        ascending: false,
      },
    );

  const accounts = requireRows(result, 'cuentas por cobrar');

  return (
    <main className="space-y-6">
      <h1 className="text-4xl font-bold">
        Cuentas por Cobrar
      </h1>

      <div className="rounded-2xl border p-6">
        {accounts?.length ? (
          <div className="space-y-3">
            {accounts.map(
              (
                account,
              ) => (
                <div
                  key={
                    account.id
                  }
                  className="rounded border p-4"
                >
                  <div className="font-semibold">
                    {
                      account.document_number
                    }
                  </div>

                  <div>
                    Monto: $
                    {
                      account.amount
                    }
                  </div>

                  <div>
                    Pagado: $
                    {
                      account.paid_amount
                    }
                  </div>

                  <div>
                    Saldo: $
                    {
                      account.balance
                    }
                  </div>

                  <div>
                    Estado:{' '}
                    {
                      account.status
                    }
                  </div>

                  <Link
                    href={`/accounts-receivable/${account.id}`}
                    className="mt-2 inline-block rounded border px-3 py-1"
                  >
                    Ver Cuenta
                  </Link>
                </div>
              ),
            )}
          </div>
        ) : (
          <p>
            No hay cuentas
            por cobrar.
          </p>
        )}
      </div>
    </main>
  );
}
