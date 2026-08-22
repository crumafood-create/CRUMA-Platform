import { describe, expect, expectTypeOf, it } from 'vitest';

import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';
import type { SupabaseServerClient } from '@/lib/auth/get-user-role';
import { resolvePublicSupabaseConfiguration } from '../../infrastructure/integrations/supabase/configuration';

const validEnvironment: NodeJS.ProcessEnv = {
  NODE_ENV: 'test',
  NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-anonymous-key',
};

describe('configuración pública de clientes Supabase', () => {
  it('mantiene el cliente servidor dentro del contrato tipado canónico', () => {
    expectTypeOf<SupabaseServerClient>().toEqualTypeOf<TypedSupabaseClient>();
  });

  it('resuelve exclusivamente la URL y la clave pública', () => {
    expect(
      resolvePublicSupabaseConfiguration({
        ...validEnvironment,
        SUPABASE_ACCESS_TOKEN: 'private-token',
        SUPABASE_SERVICE_ROLE_KEY: 'private-service-role',
      }),
    ).toEqual({
      url: 'http://127.0.0.1:54321',
      anonymousKey: 'public-anonymous-key',
    });
  });

  it.each([
    ['NEXT_PUBLIC_SUPABASE_URL', undefined],
    ['NEXT_PUBLIC_SUPABASE_URL', ''],
    ['NEXT_PUBLIC_SUPABASE_ANON_KEY', undefined],
    ['NEXT_PUBLIC_SUPABASE_ANON_KEY', ''],
  ])('rechaza configuración pública incompleta: %s', (key, value) => {
    expect(() =>
      resolvePublicSupabaseConfiguration({
        ...validEnvironment,
        [key]: value,
      }),
    ).toThrow('Configuración pública de Supabase incompleta.');
  });

  it.each([
    'invalid-url',
    'file:///tmp/supabase',
    'https://user:secret@example.com',
  ])('rechaza URL públicas inválidas o con credenciales: %s', (url) => {
    expect(() =>
      resolvePublicSupabaseConfiguration({
        ...validEnvironment,
        NEXT_PUBLIC_SUPABASE_URL: url,
      }),
    ).toThrow('URL pública de Supabase inválida.');
  });
});
