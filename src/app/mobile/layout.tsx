import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { MobileShell } from '@/app/mobile/_components/mobile-shell';
import { requireTypedAuthorizedAction } from '@/lib/auth/guards/action.guard';
import { isAuthorizationError } from '@/lib/auth/guards/permission.guard';
import { PERMISSIONS } from '@/lib/auth/permissions/permissions.constants';

export default async function MobileLayout({ children }: { children: ReactNode }) {
  try {
    await requireTypedAuthorizedAction(PERMISSIONS.MOBILE_OPERATIONS_ACCESS);
  } catch (error) {
    if (!isAuthorizationError(error)) throw error;
    redirect(error.reason === 'permission_missing' ? '/' : '/login');
  }
  return <MobileShell>{children}</MobileShell>;
}
