import type { ReactNode }
from 'react';

import { redirect }
from 'next/navigation';

import { getUser }
from '@/domains/auth/services/get-user';

import { DashboardShell }
from '@/shared/layouts/dashboard-shell';

export default function Layout({

  children,

  modal,

  analytics,

  activity

}: Props) {

  return (

    <div className="space-y-6">

      {children}

      <div className="grid gap-6 lg:grid-cols-2">

        {analytics}

        {activity}

      </div>

      {modal}

    </div>
  );
}
export default async function AdminLayout({
  children
}: {
  interface Props {

  children: ReactNode;

  modal: ReactNode;

  analytics: ReactNode;

  activity: ReactNode;
}
                                          
}) {

  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  return (

    <DashboardShell>

      {children}

    </DashboardShell>
  );
}
