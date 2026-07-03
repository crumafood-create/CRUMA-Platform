import Link from 'next/link';

export default function MobilePage() {
  return (
    <main className="space-y-4 p-6">
      <h1 className="text-3xl font-bold">
        CRUMAFOOD Mobile
      </h1>

      <div className="grid gap-4">
        <Link
          href="/mobile/receive"
          className="rounded-2xl border p-6"
        >
          📦 Recepciones
        </Link>

        <Link
          href="/mobile/production"
          className="rounded-2xl border p-6"
        >
          🏭 Producción
        </Link>

        <Link
          href="/mobile/picking"
          className="rounded-2xl border p-6"
        >
          🚚 Picking
        </Link>

        <Link
          href="/mobile/inventory"
          className="rounded-2xl border p-6"
        >
          📊 Inventario
        </Link>

        <Link
          href="/mobile/lots"
          className="rounded-2xl border p-6"
        >
          🔍 Lotes
        </Link>

        <Link
          href="/mobile/scan"
          className="rounded-2xl border p-6"
        >
          📷 Escanear
        </Link>
      </div>
    </main>
  );
}
