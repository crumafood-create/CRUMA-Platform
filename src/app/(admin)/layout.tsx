export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <aside>
        Menú Admin
      </aside>

      <main>
        {children}
      </main>
    </div>
  );
}
