import Link from 'next/link';

import { SupplierForm } from '@/app/(admin)/_components/supplier-form';

import {
  createSupplier,
} from '../actions';

export default function NewSupplierPage() {
  return (
    <main className="space-y-6">
      <div>
        <Link
          href="/suppliers"
          className="text-sm text-blue-600"
        >
          ← Volver
        </Link>

        <h1 className="mt-2 text-4xl font-bold">
          Nuevo Proveedor
        </h1>
      </div>

      <SupplierForm
        action={createSupplier}
      />
    </main>
  );
}
