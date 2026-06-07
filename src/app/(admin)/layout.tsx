import AdminSidebar from './_components/admin-sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      <AdminSidebar />

      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
