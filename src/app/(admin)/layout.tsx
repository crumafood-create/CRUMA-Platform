import type { ReactNode }
from 'react';

import { redirect }
from 'next/navigation';

import { getUser }
from '@/domains/auth/services/get-user';

import { DashboardShell }
from '@/shared/layouts/dashboard-shell';

interface Props {

  children: ReactNode;

  modal: ReactNode;

  analytics: ReactNode;

  activity: ReactNode;
}

export default async function AdminLayout({

  children,

  modal,

  analytics,

  activity

}: Props) {

  const user =
    await getUser();

  if (!user) {

    redirect('/login');
  }

  return (

    <DashboardShell>

      <div className="space-y-6">

        {children}

        <div className="grid gap-6 lg:grid-cols-2">

          {analytics}

          {activity}

        </div>

        {modal}

      </div>

    </DashboardShell>
  );
}
