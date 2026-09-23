import type { SupabaseServerClient, LegacyRole } from '@/modules/identity/get-user-roles';

export type AuthorizationActor = {
  userId: string;
  roles: readonly LegacyRole[];
  authorizationSource: 'legacy_user_roles';
};

export type AuthorizationContext = {
  actor: AuthorizationActor;
  supabase: SupabaseServerClient;
};