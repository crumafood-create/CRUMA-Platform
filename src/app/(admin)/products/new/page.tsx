import Link from 'next/link';
import { createProduct } from '../actions';
import { ProductForm } from './_components/product-form';

export default function NewProductPage() {
  return (
    <main className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Nuevo Producto</h1>
        <Link href="/products" className="rounded-lg border px-4 py-2">
          Volver
        </Link>
      </div>

      <ProductForm action={createProduct} />
    </main>
  );
}
