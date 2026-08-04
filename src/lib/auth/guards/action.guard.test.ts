import { expect, test, vi } from 'vitest';

import type { SupabaseServerClient } from '@/lib/auth/get-user-role';
import { PERMISSIONS } from '@/lib/auth/permissions/permissions.constants';

import { requireAuthorizedAction } from './action.guard';
import { AuthorizationError } from './permission.guard';

function clientWith(
  user: { id: string } | null,
  roles: Array<{ role: unknown }> = [],
): SupabaseServerClient {
  const getUser = vi.fn().mockResolvedValue({
    data: { user },
    error: null,
  });
  const eq = vi.fn().mockResolvedValue({
    data: roles,
    error: null,
  });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });

  return {
    auth: { getUser },
    from,
  } as unknown as SupabaseServerClient;
}

test('requireAuthorizedAction permite al admin y reutiliza su cliente', async () => {
  const client = clientWith(
    { id: '00000000-0000-0000-0000-000000000001' },
    [{ role: 'admin' }],
  );

  const context = await requireAuthorizedAction(
    PERMISSIONS.PRODUCTION_ORDER_CREATE,
    client,
  );

  expect(context.actor.roles).toEqual(['admin']);
  expect(context.supabase).toBe(client);
});

test('requireAuthorizedAction deniega customer antes del caso de uso', async () => {
  const client = clientWith(
    { id: '00000000-0000-0000-0000-000000000002' },
    [{ role: 'customer' }],
  );

  await expect(
    requireAuthorizedAction(
      PERMISSIONS.SALES_ORDER_DELIVER,
      client,
    ),
  ).rejects.toEqual(
    expect.objectContaining<Partial<AuthorizationError>>({
      reason: 'permission_missing',
    }),
  );
});

test('requireAuthorizedAction deniega una sesión ausente', async () => {
  const client = clientWith(null);

  await expect(
    requireAuthorizedAction(
      PERMISSIONS.PRODUCTION_ORDER_CREATE,
      client,
    ),
  ).rejects.toEqual(
    expect.objectContaining<Partial<AuthorizationError>>({
      reason: 'unauthenticated',
    }),
  );
});
