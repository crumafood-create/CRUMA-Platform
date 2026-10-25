import type { LegacyRole } from '@/modules/identity/get-user-roles';

/**
 * El rol legacy todavía se resuelve de forma global.
 * No existe alcance por organización, planta ni almacén.
 *
 * Esta ausencia es deliberada y transitoria. ADR-0017 reemplaza
 * ADR-0001 y ADR-0003, pero conserva user_roles como autoridad
 * efectiva. No se debe simular ese alcance con filtros de interfaz
 * ni con un tenant aceptado desde el cliente.
 */
export const LEGACY_AUTHORIZATION_SCOPE = 'global' as const;

export type LegacyAuthorizationScope = typeof LEGACY_AUTHORIZATION_SCOPE;

export type LegacyAuthorizationBoundary = {
  readonly source: 'legacy_user_roles';
  readonly scope: LegacyAuthorizationScope;
  readonly supportedRoles: readonly LegacyRole[];
  readonly missingScopes: readonly [
    'organization',
    'plant',
    'warehouse',
  ];
};

export const LEGACY_AUTHORIZATION_BOUNDARY = {
  source: 'legacy_user_roles',
  scope: LEGACY_AUTHORIZATION_SCOPE,
  supportedRoles: ['admin', 'customer'],
  missingScopes: ['organization', 'plant', 'warehouse'],
} as const satisfies LegacyAuthorizationBoundary;
