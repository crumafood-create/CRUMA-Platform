import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { AdminShell } from '@/shared/components/layout';
import { requireTypedAuthorizedAction } from '@/modules/identity/guards/action.guard';
import { isAuthorizationError } from '@/modules/identity/guards/authorization-error';
import { PERMISSIONS } from '@/modules/identity/permissions/permissions.constants';

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