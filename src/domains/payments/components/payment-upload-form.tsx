'use client';

import { uploadPaymentProofAction }
from '../actions/upload-payment-proof.action';

import { Button }
from '@/shared/ui/button';

interface Props {

  orderId: string;
}

export function PaymentUploadForm({
  orderId
}: Props) {

  return (

    <form
      action={uploadPaymentProofAction}
      className="space-y-4"
    >

      <input
        type="hidden"
        name="orderId"
        value={orderId}
      />

      <input
        type="file"
        name="file"
        required
      />

      <Button type="submit">

        Subir comprobante

      </Button>

    </form>
  );
}
