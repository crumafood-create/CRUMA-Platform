import { CustomerForm } from '@/app/(admin)/_components/customer-form';

import { createCustomer } from '../actions';

export default function NewCustomerPage() {
  return (
    <main className="space-y-6">
      <h1 className="text-4xl font-bold">
        Nuevo Cliente
      </h1>

      <CustomerForm
        action={
          createCustomer
        }
      />
    </main>
  );
}
