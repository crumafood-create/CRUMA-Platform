import type { LegacyRole } from '@/lib/auth/get-user-role';

import {
  PERMISSIONS,
  type Permission,
} from './permissions.constants';

const ALL_LEGACY_PERMISSIONS = Object.values(
  PERMISSIONS,
) as Permission[];

export const LEGACY_ROLE_PERMISSIONS = {
  admin: ALL_LEGACY_PERMISSIONS,
  customer: [],
} satisfies Record<LegacyRole, readonly Permission[]>;
