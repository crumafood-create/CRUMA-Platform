import Link from 'next/link';

export default function AdminSidebar() {
  return (
    <aside className="w-64 border-r bg-white p-6">
      <h2 className="mb-6 text-xl font-bold">
        CRUMA Platform
      </h2>

      <nav className="flex flex-col gap-2">
        <Link href="/dashboard">
          🏠 Dashboard
        </Link>

        <div className="mt-4 text-xs font-semibold uppercase text-gray-500">
          Catálogo
        </div>

        <Link href="/categories">
          📂 Categorías
        </Link>

        <Link href="/families">
          🗂️ Familias
        </Link>

        <Link href="/products">
          📦 Productos
        </Link>

        <Link href="/flavors">
          🎨 Sabores
        </Link>

        <div className="mt-4 text-xs font-semibold uppercase text-gray-500">
          Operaciones
        </div>

        <Link href="/inventory">
          📋 Inventario
        </Link>

        <Link href="/inventory-locations">
          📍 Ubicaciones
        </Link>

        <Link href="/inventory/alerts">
          🚨 Alertas
        </Link>

        <div className="mt-4 text-xs font-semibold uppercase text-gray-500">
          Administración
        </div>

        <Link href="/users">
          👥 Usuarios
        </Link>
      </nav>
    </aside>
  );
}
