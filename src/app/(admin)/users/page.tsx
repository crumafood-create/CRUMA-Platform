import { redirect } from 'next/navigation';

import { requireAuthenticatedUser } from '@/modules/identity/guards/auth.guard';
import {
  isAuthorizationError,
  requirePermission,
} from '@/modules/identity/guards/permission.guard';
import { PERMISSIONS } from '@/modules/identity/permissions/permissions.constants';

export default async function UsersPage() {
  const { actor } = await requireAuthenticatedUser().catch(
    (error: unknown) => {
      if (
        isAuthorizationError(error) &&
        error.reason === 'unauthenticated'
      ) {
        redirect('/login');
      }

      throw error;
    },
  );

  try {
    requirePermission(actor, PERMISSIONS.IDENTITY_USER_MANAGE);
  } catch (error) {
    if (isAuthorizationError(error)) {
      redirect('/dashboard');
    }

    throw error;
  }

  return (
    <div>
      <h1>Usuarios</h1>
    </div>
  );
}
