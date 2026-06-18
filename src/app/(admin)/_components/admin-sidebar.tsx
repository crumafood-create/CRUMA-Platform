import Link from 'next/link';

export default function AdminSidebar() {
  return (
    <aside className="w-64 border-r bg-white p-6">
      <h2 className="mb-6 text-xl font-bold">
        CRUMA Platform
      </h2>

      <nav className="flex flex-col gap-2">
        <Link
          href="/dashboard"
          className="rounded px-2 py-1 hover:bg-gray-100"
        >
          🏠 Dashboard
        </Link>

        <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Catálogo
        </div>

        <Link
          href="/categories"
          className="rounded px-2 py-1 hover:bg-gray-100"
        >
          📂 Categorías
        </Link>

        <Link
          href="/families"
          className="rounded px-2 py-1 hover:bg-gray-100"
        >
          🗂️ Familias
        </Link>

        <Link
          href="/products"
          className="rounded px-2 py-1 hover:bg-gray-100"
        >
          📦 Productos
        </Link>

        <Link
          href="/flavors"
          className="rounded px-2 py-1 hover:bg-gray-100"
        >
          🎨 Sabores
        </Link>

        <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Operaciones
        </div>

        <Link
          href="/inventory"
          className="rounded px-2 py-1 hover:bg-gray-100"
        >
          📋 Inventario
        </Link>

        <Link
          href="/inventory-locations"
          className="rounded px-2 py-1 hover:bg-gray-100"
        >
          📍 Ubicaciones
        </Link>

        <Link
          href="/inventory/alerts"
          className="rounded px-2 py-1 hover:bg-gray-100"
        >
          🚨 Alertas
        </Link>

        <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Producción
        </div>

        <Link
          href="/recipes"
          className="rounded px-2 py-1 hover:bg-gray-100"
        >
          🧾 Recetas
        </Link>

        <Link
          href="/production-orders"
          className="rounded px-2 py-1 hover:bg-gray-100"
        >
          🏭 Órdenes de Producción
        </Link>

        <Link
          href="/costing"
          className="rounded px-2 py-1 hover:bg-gray-100"
        >
          💰 Costos
        </Link>

        <Link
          href="/lots"
          className="rounded px-2 py-1 hover:bg-gray-100"
        >
          🔖 Lotes
        </Link>

        <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Administración
        </div>

        <Link
          href="/users"
          className="rounded px-2 py-1 hover:bg-gray-100"
        >
          👥 Usuarios
        </Link>
        <Link href="/units-of-measure">
  Unidades
</Link>
      </nav>
    </aside>
  );
}
