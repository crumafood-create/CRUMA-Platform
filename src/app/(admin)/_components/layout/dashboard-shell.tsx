export function DashboardShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div>
      <AdminSidebar />
      <main>{children}</main>
    </div>
  );
}
