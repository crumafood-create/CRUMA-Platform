import Link from 'next/link';

export default function AdminSidebar() {
  return (
    <aside className="w-64 border-r bg-white p-6">
      <h2 className="text-xl font-bold mb-6">
        CRUMA Platform
      </h2>

      <nav className="flex flex-col gap-3">
        <Link href="/dashboard">
          Dashboard
        </Link>

        <Link href="/users">
          Usuarios
        </Link>

        <Link href="/products">
          Productos
        </Link>
      </nav>
    </aside>
  );
}
