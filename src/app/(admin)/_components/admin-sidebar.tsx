import Link from 'next/link';

export default function AdminSidebar() {
  return (
    <aside className="w-64 border-r bg-white p-6">
      <h2 className="mb-6 text-xl font-bold">
        CRUMA Platform
      </h2>

      <nav className="flex flex-col gap-2">
        {/* Dashboard */}
        <Link
          href="/dashboard"
          className="rounded px-2 py-1 hover:bg-gray-100"
        >
          🏠 Dashboard
        </Link>

        {/* Configuración Maestra */}
        <div className="mt-6 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Configuración Maestra
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
          href="/units-of-measure"
          className="rounded px-2 py-1 hover:bg-gray-100"
        >
          ⚖️ Unidades de Medida
        </Link>

        <Link
          href="/warehouses"
          className="rounded px-2 py-1 hover:bg-gray-100"
        >
          🏬 Almacenes
        </Link>

        <Link
          href="/flavors"
          className="rounded px-2 py-1 hover:bg-gray-100"
        >
          🎨 Sabores
        </Link>

        {/* Productos */}
        <div className="mt-6 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Productos
        </div>

        <Link
          href="/raw-materials"
          className="rounded px-2 py-1 hover:bg-gray-100"
        >
          🥛 Materias Primas
        </Link>

        <Link
          href="/products"
          className="rounded px-2 py-1 hover:bg-gray-100"
        >
          📦 Productos
        </Link>

        <Link
          href="/recipes"
          className="rounded px-2 py-1 hover:bg-gray-100"
        >
          🧾 Recetas
        </Link>

        <Link
          href="/purchase-orders"
          className="rounded px-2 py-1 hover:bg-gray-100"
        >
          🛒 Compras
        </Link>

        {/* Inventario */}
        <div className="mt-6 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Inventario
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
           href="/inventory/adjustments"
           className="rounded px-2 py-1 hover:bg-gray-100"
        >
           🔄 Ajustes
         </Link>

        <Link
          href="/lots"
          className="rounded px-2 py-1 hover:bg-gray-100"
        >
          🔖 Lotes
        </Link>

        <Link
          href="/inventory/alerts"
          className="rounded px-2 py-1 hover:bg-gray-100"
        >
          🚨 Alertas
        </Link>

        <Link
          href="/inventory/adjustments"
          className="rounded px-2 py-1 hover:bg-gray-100"
        >
         🔄 Ajustes
        </Link>

        {/* Producción */}
        <div className="mt-6 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Producción
        </div>

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

        {/* Administración */}
        <div className="mt-6 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Administración
        </div>

        <Link
          href="/users"
          className="rounded px-2 py-1 hover:bg-gray-100"
        >
          👥 Usuarios
        </Link>

        {/* Ventas */}
<div className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
  Ventas
</div>

<Link
  href="/customers"
  className="rounded px-2 py-1 hover:bg-gray-100"
>
  👤 Clientes
</Link>

<Link
  href="/sales-orders"
  className="rounded px-2 py-1 hover:bg-gray-100"
>
  🛒 Pedidos
</Link>

<Link
  href="/accounts-receivable"
  className="rounded px-2 py-1 hover:bg-gray-100"
>
  💳 Cuentas por Cobrar
</Link>

        <Link
  href="/mrp"
  className="rounded px-2 py-1 hover:bg-gray-100"
>
  🏭 Planeación (MRP)
</Link>

        <Link
  href="/inventory-atp"
  className="rounded px-2 py-1 hover:bg-gray-100"
>
  📦 ATP
</Link>

        <Link
  href="/demand-forecasts"
  className="rounded px-2 py-1 hover:bg-gray-100"
>
  📈 Pronóstico
</Link>
        <Link
  href="/dashboard"
  className="rounded px-2 py-1 hover:bg-gray-100"
>
  📊 Dashboard
</Link>

        <Link
  href="/notifications"
  className="rounded px-2 py-1 hover:bg-gray-100"
>
  🔔 Notificaciones
</Link>
        
      </nav>
    </aside>
  );
}
