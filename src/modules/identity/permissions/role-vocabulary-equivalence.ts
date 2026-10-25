import { LEGACY_ROLES } from '@/modules/identity/legacy-role-contract';

import { LEGACY_ROLE_PERMISSIONS } from './permissions.matrix';
import {
  PERMISSIONS,
  type Permission,
} from './permissions.constants';

/**
 * Matriz de equivalencia entre los cuatro vocabularios verificados.
 *
 * Cumple la condición documental de ADR-0017: deja explícito que
 * ningún valor externo equivale hoy a un rol efectivo. No concede
 * permisos ni retira el bloqueo de la migración.
 */
export const ROLE_VOCABULARY_EQUIVALENCE_DATE = '2026-10-09' as const;

export const ROLE_VOCABULARIES = [
  'user_roles',
  'profiles',
  'tenant_members',
  'admin_permissions',
] as const;

export type RoleVocabulary = (typeof ROLE_VOCABULARIES)[number];

export type RoleEquivalence = {
  readonly vocabulary: RoleVocabulary;
  readonly relation: string;
  readonly value: string;
  readonly equivalentLegacyRole: (typeof LEGACY_ROLES)[number] | null;
  readonly equivalentPermissions: readonly Permission[];
  readonly authorizes: boolean;
  readonly reason: string;
};

const NO_PERMISSIONS = [] as const satisfies readonly Permission[];

export const ROLE_VOCABULARY_EQUIVALENCE = [
  {
    vocabulary: 'user_roles',
    relation: 'public.user_roles.role',
    value: 'admin',
    equivalentLegacyRole: 'admin',
    equivalentPermissions: LEGACY_ROLE_PERMISSIONS.admin,
    authorizes: true,
    reason: 'Único valor que hoy concede el catálogo publicado.',
  },
  {
    vocabulary: 'user_roles',
    relation: 'public.user_roles.role',
    value: 'customer',
    equivalentLegacyRole: 'customer',
    equivalentPermissions: LEGACY_ROLE_PERMISSIONS.customer,
    authorizes: true,
    reason: 'Rol efectivo sin permisos operativos.',
  },
  {
    vocabulary: 'profiles',
    relation: 'public.profiles.role',
    value: 'client',
    equivalentLegacyRole: null,
    equivalentPermissions: NO_PERMISSIONS,
    authorizes: false,
    reason: 'Dato de perfil. No equivale a customer ni autoriza.',
  },
  {
    vocabulary: 'profiles',
    relation: 'public.profiles.role',
    value: 'admin',
    equivalentLegacyRole: null,
    equivalentPermissions: NO_PERMISSIONS,
    authorizes: false,
    reason: 'Mismo texto que user_roles.admin, pero no es la misma autoridad.',
  },
  {
    vocabulary: 'profiles',
    relation: 'public.profiles.role',
    value: 'b2b',
    equivalentLegacyRole: null,
    equivalentPermissions: NO_PERMISSIONS,
    authorizes: false,
    reason: 'Segmento comercial. No equivale a ningún rol efectivo.',
  },
  {
    vocabulary: 'tenant_members',
    relation: 'public.tenant_members.role',
    value: 'owner',
    equivalentLegacyRole: null,
    equivalentPermissions: NO_PERMISSIONS,
    authorizes: false,
    reason: 'Membresía de tenant. No hereda permisos de user_roles.admin.',
  },
  {
    vocabulary: 'tenant_members',
    relation: 'public.tenant_members.role',
    value: 'admin',
    equivalentLegacyRole: null,
    equivalentPermissions: NO_PERMISSIONS,
    authorizes: false,
    reason: 'Mismo texto que user_roles.admin, pero no autoriza.',
  },
  {
    vocabulary: 'tenant_members',
    relation: 'public.tenant_members.role',
    value: 'member',
    equivalentLegacyRole: null,
    equivalentPermissions: NO_PERMISSIONS,
    authorizes: false,
    reason: 'Pertenencia al tenant. No equivale a customer.',
  },
  {
    vocabulary: 'tenant_members',
    relation: 'public.tenant_members.role',
    value: 'viewer',
    equivalentLegacyRole: null,
    equivalentPermissions: NO_PERMISSIONS,
    authorizes: false,
    reason: 'Lectura prevista, todavía sin permiso canónico equivalente.',
  },
  {
    vocabulary: 'admin_permissions',
    relation: 'public.user_admin_permissions',
    value: 'permission_id',
    equivalentLegacyRole: null,
    equivalentPermissions: NO_PERMISSIONS,
    authorizes: false,
    reason:
      'Permiso directo por UUID. Su código no está unificado con PERMISSIONS.',
  },
] as const satisfies readonly RoleEquivalence[];

export function equivalentPermissions(
  vocabulary: RoleVocabulary,
  value: string,
): readonly Permission[] {
  const match = ROLE_VOCABULARY_EQUIVALENCE.find(
    (entry) => entry.vocabulary === vocabulary && entry.value === value,
  );

  if (!match) {
    throw new Error(
      `No existe equivalencia verificada para ${vocabulary}.${value}.`,
    );
  }

  return match.equivalentPermissions;
}

export const PUBLISHED_PERMISSION_COUNT = Object.values(
  PERMISSIONS,
).length;
