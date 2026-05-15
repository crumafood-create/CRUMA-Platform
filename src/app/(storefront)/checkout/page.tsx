import { CheckoutForm }
from '@/domains/checkout/components/checkout-form';

export default function CheckoutPage() {

  return (

    <main className="mx-auto max-w-3xl p-8">

      <h1 className="mb-8 text-4xl font-bold">

        Checkout

      </h1>

      <CheckoutForm />

    </main>
  );
}
