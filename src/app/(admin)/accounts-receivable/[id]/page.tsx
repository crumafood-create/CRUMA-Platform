import Link from 'next/link';
import { notFound } from 'next/navigation';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export default async function AccountsReceivableDetailPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } =
    await params;

  const supabase =
    await createClient();

  const {
    data: account,
  } = await supabase
    .from(
      'accounts_receivable',
    )
    .select('*')
    .eq('id', id)
    .single();

  if (!account) {
    notFound();
  }

  return (
    <main className="space-y-6">
      <h1 className="text-4xl font-bold">
        Cuenta por Cobrar
      </h1>

      <div className="rounded-2xl border p-6 space-y-4">
        <div>
          Documento:{' '}
          {
            account.document_number
          }
        </div>

        <div>
          Monto: $
          {account.amount}
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
      </div>

      <Link
        href={`/accounts-receivable/${id}/payments`}
        className="rounded border px-4 py-2"
      >
        Registrar Pago
      </Link>
    </main>
  );
}
