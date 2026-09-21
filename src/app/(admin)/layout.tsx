import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { AdminShell } from '@/app/(admin)/_components/admin-shell';
import { requireTypedAuthorizedAction } from '@/lib/auth/guards/action.guard';
import { isAuthorizationError } from '@/lib/auth/guards/permission.guard';
import { PERMISSIONS } from '@/lib/auth/permissions/permissions.constants';

type AdminLayoutProps = {
  children: ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  try {
    await requireTypedAuthorizedAction(PERMISSIONS.ADMIN_PANEL_ACCESS);
  } catch (error) {
    if (!isAuthorizationError(error)) throw error;

    if (error.reason === 'permission_missing') {
      redirect('/login?error=admin_required');
    }

    redirect('/login');
  }

  return <AdminShell>{children}</AdminShell>;
}
