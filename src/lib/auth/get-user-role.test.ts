import { expect, test, vi } from 'vitest';

import {
  getUserRoles,
  LegacyRoleLookupError,
  type SupabaseServerClient,
} from './get-user-role';

function clientReturning(result: {
  data: Array<{ role: unknown }> | null;
  error: unknown;
}): SupabaseServerClient {
  const eq = vi.fn().mockResolvedValue(result);
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });

  return { from } as unknown as SupabaseServerClient;
}

test('getUserRoles devuelve todos los roles sin usar cardinalidad única', async () => {
  const client = clientReturning({
    data: [
      { role: 'customer' },
      { role: 'admin' },
      { role: 'admin' },
    ],
    error: null,
  });

  await expect(
    getUserRoles('00000000-0000-0000-0000-000000000001', client),
  ).resolves.toEqual(['customer', 'admin']);
});

test('getUserRoles falla cerrado cuando la consulta falla', async () => {
  const client = clientReturning({
    data: null,
    error: { message: 'database unavailable' },
  });

  await expect(
    getUserRoles('00000000-0000-0000-0000-000000000001', client),
  ).rejects.toBeInstanceOf(LegacyRoleLookupError);
});

test('getUserRoles rechaza roles fuera del contrato legacy', async () => {
  const client = clientReturning({
    data: [{ role: 'manager' }],
    error: null,
  });

  await expect(
    getUserRoles('00000000-0000-0000-0000-000000000001', client),
  ).rejects.toBeInstanceOf(LegacyRoleLookupError);
});
