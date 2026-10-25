import type { Permission } from './permissions.constants';
import {
  equivalentPermissions,
  ROLE_VOCABULARIES,
  ROLE_VOCABULARY_EQUIVALENCE,
  type RoleVocabulary,
} from './role-vocabulary-equivalence';

/**
 * Lectura unificada de los cuatro vocabularios.
 *
 * No crea una autoridad nueva: los valores externos quedan
 * normalizados, pero sus permisos siguen vacíos.
 */
export type UnifiedRoleClaim = {
  readonly vocabulary: RoleVocabulary;
  readonly value: string;
};

export type UnifiedRoleVocabulary = {
  readonly claims: readonly UnifiedRoleClaim[];
  readonly permissions: readonly Permission[];
  readonly widened: false;
};

export function unifyRoleVocabulary(
  claims: readonly UnifiedRoleClaim[],
): UnifiedRoleVocabulary {
  const vocabularies = new Set(claims.map((claim) => claim.vocabulary));
  const missing = ROLE_VOCABULARIES.filter(
    (vocabulary) => !vocabularies.has(vocabulary),
  );

  if (missing.length > 0) {
    throw new Error(
      `Faltan vocabularios para unificar: ${missing.join(', ')}.`,
    );
  }

  const permissions = claims.flatMap((claim) => [
    ...equivalentPermissions(claim.vocabulary, claim.value),
  ]);
  const externalPermissions = claims
    .filter((claim) => claim.vocabulary !== 'user_roles')
    .flatMap((claim) => [
      ...equivalentPermissions(claim.vocabulary, claim.value),
    ]);

  if (externalPermissions.length > 0) {
    throw new Error(
      'La unificación concedería permisos fuera de user_roles.',
    );
  }

  return {
    claims,
    permissions,
    widened: false,
  };
}

export const UNIFIED_ROLE_VOCABULARY_SIZE =
  ROLE_VOCABULARY_EQUIVALENCE.length;
