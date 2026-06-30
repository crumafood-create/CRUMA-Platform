import { AccountsReceivablePaymentForm } from '@/app/(admin)/_components/accounts-receivable-payment-form';

import { createAccountsReceivablePayment } from './actions';

export default async function PaymentPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } =
    await params;

  return (
    <main className="space-y-6">
      <h1 className="text-4xl font-bold">
        Registrar Pago
      </h1>

      <AccountsReceivablePaymentForm
        action={
          createAccountsReceivablePayment
        }
        accountId={id}
      />
    </main>
  );
}
