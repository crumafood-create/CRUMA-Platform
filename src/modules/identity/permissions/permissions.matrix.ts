import type { LegacyRole } from '@/modules/identity/get-user-roles';

import { LEGACY_AUTHORIZATION_BOUNDARY } from './legacy-authorization-boundary';
import {
  PERMISSIONS,
  type Permission,
} from './permissions.constants';

/**
 * Contrato congelado del puente legacy.
 *
 * `admin` conserva todos los permisos publicados, pero solo dentro
 * del alcance global documentado por la frontera. `customer` permanece
 * sin autoridad operativa. Agregar un permiso a `PERMISSIONS` cambia
 * este contrato y debe aparecer en su prueba de snapshot.
 */
const ALL_LEGACY_PERMISSIONS = Object.values(
  PERMISSIONS,
) as Permission[];

export const LEGACY_ROLE_PERMISSIONS = {
  admin: ALL_LEGACY_PERMISSIONS,
  customer: [],
} as const satisfies Record<LegacyRole, readonly Permission[]>;

export const LEGACY_PERMISSION_CONTRACT = {
  boundary: LEGACY_AUTHORIZATION_BOUNDARY,
  grants: LEGACY_ROLE_PERMISSIONS,
} as const;
