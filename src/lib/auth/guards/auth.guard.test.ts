import { expect, test, vi } from 'vitest';

import type { SupabaseServerClient } from '@/lib/auth/get-user-role';

import { requireAuthenticatedUser } from './auth.guard';
import { AuthorizationError } from './permission.guard';

type ClientOptions = {
  user: { id: string } | null;
  authError?: unknown;
  roles?: Array<{ role: unknown }>;
  roleError?: unknown;
};

function clientWith({
  user,
  authError = null,
  roles = [],
  roleError = null,
}: ClientOptions): SupabaseServerClient {
  const getUser = vi.fn().mockResolvedValue({
    data: { user },
    error: authError,
  });
  const eq = vi.fn().mockResolvedValue({
    data: roles,
    error: roleError,
  });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });

  return {
    auth: { getUser },
    from,
  } as unknown as SupabaseServerClient;
}

test('requireAuthenticatedUser construye un actor con todos sus roles', async () => {
  const client = clientWith({
    user: {
      id: '00000000-0000-0000-0000-000000000001',
    },
    roles: [{ role: 'customer' }, { role: 'admin' }],
  });

  const context = await requireAuthenticatedUser(client);

  expect(context.actor).toEqual({
    userId: '00000000-0000-0000-0000-000000000001',
    roles: ['customer', 'admin'],
    authorizationSource: 'legacy_user_roles',
  });
  expect(context.supabase).toBe(client);
});

test('requireAuthenticatedUser deniega una sesión ausente', async () => {
  const client = clientWith({ user: null });

  await expect(
    requireAuthenticatedUser(client),
  ).rejects.toEqual(
    expect.objectContaining<Partial<AuthorizationError>>({
      reason: 'unauthenticated',
    }),
  );
});

test('requireAuthenticatedUser falla cerrado si no resuelve roles', async () => {
  const client = clientWith({
    user: {
      id: '00000000-0000-0000-0000-000000000001',
    },
    roleError: { message: 'database unavailable' },
  });

  await expect(
    requireAuthenticatedUser(client),
  ).rejects.toEqual(
    expect.objectContaining<Partial<AuthorizationError>>({
      reason: 'authorization_context_unavailable',
    }),
  );
});
