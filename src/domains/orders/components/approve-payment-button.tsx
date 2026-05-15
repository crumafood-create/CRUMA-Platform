'use client';

import { approvePaymentAction }
from '../actions/approve-payment.action';

import { Button }
from '@/shared/ui/button';

interface Props {

  orderId: string;
}

export function ApprovePaymentButton({
  orderId
}: Props) {

  return (

    <Button
      onClick={() =>
        approvePaymentAction(orderId)
      }
    >

      Aprobar pago

    </Button>
  );
}
