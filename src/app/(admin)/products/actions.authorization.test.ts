import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { expect, it, vi } from 'vitest';

import { createProduct, createProductForForm } from './actions';

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock('@/infrastructure/integrations/supabase/server', () => ({ createTypedClient: createClient }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

it('rechaza el alta sin sesión o sin admin explícito en user_roles antes de insertar', async () => {
  const user = { id: 'user-1', app_metadata: { role: 'admin' }, user_metadata: { role: 'admin' } };
  const cases = [
    { user: null, roles: [], reason: 'unauthenticated' },
    { user, roles: [], reason: 'permission_missing' },
    { user, roles: [{ role: 'customer' }], reason: 'permission_missing' },
  ];
  for (const action of [createProduct, createProductForForm]) {
    for (const scenario of cases) {
      vi.clearAllMocks();
      const insert = vi.fn().mockResolvedValue({ error: null });
      const roleLookup = vi.fn().mockResolvedValue({ data: scenario.roles, error: null });
      const from = vi.fn((table: string) => table === 'user_roles'
        ? { select: () => ({ eq: roleLookup }) } : { insert });
      createClient.mockResolvedValue({ from, auth: {
        getUser: async () => ({ data: { user: scenario.user }, error: null }),
      } });
      const form = new FormData();
      form.set('name', 'Pan integral');
      form.set('slug', 'pan-integral');
      form.set('role', 'admin');

      await expect(action(form)).rejects.toMatchObject({ name: 'AuthorizationError', reason: scenario.reason });
      expect(insert).not.toHaveBeenCalled();
      expect(revalidatePath).not.toHaveBeenCalled();
      expect(redirect).not.toHaveBeenCalled();
      if (scenario.user) {
        expect(from).toHaveBeenCalledExactlyOnceWith('user_roles');
        expect(roleLookup).toHaveBeenCalledExactlyOnceWith('user_id', 'user-1');
      } else expect(from).not.toHaveBeenCalled();
    }
  }
});
