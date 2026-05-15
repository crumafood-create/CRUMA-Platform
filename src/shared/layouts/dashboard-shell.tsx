import type { ReactNode }
from 'react';

export function DashboardShell({
  children
}: {
  children: ReactNode;
}) {

  return (

    <div className="flex min-h-screen">

      <aside className="w-64 border-r p-6">

        Sidebar

      </aside>

      <main className="flex-1 p-8">

        {children}

      </main>

    </div>
  );
}
