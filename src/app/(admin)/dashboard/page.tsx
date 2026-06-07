import { LogoutButton } from '@/components/auth/logout-button';

export default function DashboardPage() {
  return (
    <main className="space-y-6">
      <h1 className="text-4xl font-bold">
        Dashboard
      </h1>

      <LogoutButton />

      <div className="rounded-2xl border p-6">
        Sistema activo
      </div>
    </main>
  );
}
