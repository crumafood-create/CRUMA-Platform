import type { SupabaseServerClient, LegacyRole } from '@/modules/identity/get-user-roles';
import type { LegacyAuthorizationBoundary } from '@/modules/identity/permissions/legacy-authorization-boundary';

export type AuthorizationActor = {
  userId: string;
  roles: readonly LegacyRole[];
  authorizationSource: LegacyAuthorizationBoundary['source'];
};

export type AuthorizationContext = {
  actor: AuthorizationActor;
  supabase: SupabaseServerClient;
};