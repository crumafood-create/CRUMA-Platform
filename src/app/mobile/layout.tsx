import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { MobileShell } from '@/shared/ui/mobile-shell';
import { requireTypedAuthorizedAction } from '@/modules/identity/guards/action.guard';
import { isAuthorizationError } from '@/modules/identity/guards/permission.guard';
import { PERMISSIONS } from '@/modules/identity/permissions/permissions.constants';

export default async function MobileLayout({ children }: { children: ReactNode }) {
  try {
    await requireTypedAuthorizedAction(PERMISSIONS.MOBILE_OPERATIONS_ACCESS);
  } catch (error) {
    if (!isAuthorizationError(error)) throw error;
    redirect(error.reason === 'permission_missing' ? '/' : '/login');
  }
  return <MobileShell>{children}</MobileShell>;
}
