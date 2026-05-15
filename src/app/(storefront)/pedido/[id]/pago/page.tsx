import { PaymentUploadForm }
from '@/domains/payments/components/payment-upload-form';

interface Props {

  params: Promise<{
    id: string;
  }>;
}

export default async function PaymentPage({
  params
}: Props) {

  const { id } = await params;

  return (

    <main className="mx-auto max-w-3xl p-8">

      <h1 className="mb-8 text-4xl font-bold">

        Subir comprobante

      </h1>

      <PaymentUploadForm
        orderId={id}
      />

    </main>
  );
}
