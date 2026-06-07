import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
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

      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
