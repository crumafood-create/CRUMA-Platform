import Link
from 'next/link';

export default function NotFoundPage() {

  return (

    <main className="flex min-h-screen items-center justify-center">

      <div className="space-y-6 text-center">

        <h1 className="text-6xl font-bold">

          404

        </h1>

        <p className="text-gray-500">

          Página no encontrada

        </p>

        <Link
          href="/"
          className="inline-block rounded-xl border px-4 py-2"
        >

          Volver al inicio

        </Link>

      </div>

    </main>
  );
}
