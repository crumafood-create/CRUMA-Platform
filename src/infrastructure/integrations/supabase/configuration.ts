export type PublicSupabaseConfiguration = Readonly<{
  url: string;
  anonymousKey: string;
}>;

function assertPublicSupabaseUrl(value: string): void {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error('URL pública de Supabase inválida.');
  }

  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password
  ) {
    throw new Error('URL pública de Supabase inválida.');
  }
}

export function resolvePublicSupabaseConfiguration(
  environment: Readonly<NodeJS.ProcessEnv>,
): PublicSupabaseConfiguration {
  const url = environment.NEXT_PUBLIC_SUPABASE_URL;
  const anonymousKey = environment.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonymousKey) {
    throw new Error('Configuración pública de Supabase incompleta.');
  }

  assertPublicSupabaseUrl(url);

  return Object.freeze({ url, anonymousKey });
}

export function getPublicSupabaseConfiguration(): PublicSupabaseConfiguration {
  return resolvePublicSupabaseConfiguration({
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}
