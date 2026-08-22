export const CANONICAL_DATABASE_TYPES_PATH =
  'src/types/database/database.generated.ts';

const REMOTE_CREDENTIAL_NAMES = [
  'SUPABASE_ACCESS_TOKEN',
  'SUPABASE_DB_PASSWORD',
  'DATABASE_URL',
  'PRODUCTION_DATABASE_URL',
] as const;

const SENSITIVE_PATTERN =
  /postgres(?:ql)?:\/\/|sbp_|SUPABASE_ACCESS_TOKEN|SERVICE_ROLE_KEY|JWT_SECRET/i;

export function createLocalTypeGenerationArgs(): readonly string[] {
  return Object.freeze([
    'exec',
    'supabase',
    'gen',
    'types',
    'typescript',
    '--local',
    '--schema',
    'public',
    '--network-id',
    'cruma-supabase-local',
  ]);
}

export function createLocalTypeGenerationEnvironment(
  input: Readonly<NodeJS.ProcessEnv>,
): Readonly<NodeJS.ProcessEnv> {
  const environment = { ...input };

  for (const credential of REMOTE_CREDENTIAL_NAMES) {
    delete environment[credential];
  }

  return Object.freeze(environment);
}

export function normalizeGeneratedDatabaseTypes(input: string): string {
  return `${input.replace(/\r\n?/g, '\n').replace(/\n*$/, '')}\n`;
}

export function assertGeneratedDatabaseTypes(input: string): void {
  if (SENSITIVE_PATTERN.test(input)) {
    throw new Error(
      'Los tipos Supabase generados contienen información sensible.',
    );
  }

  const hasJson = /\bexport\s+type\s+Json\s*=/.test(input);
  const hasDatabase = /\bexport\s+type\s+Database\s*=/.test(input);
  const hasPublicSchema = /\bpublic\s*:/.test(input);

  if (!hasJson || !hasDatabase || !hasPublicSchema) {
    throw new Error('Los tipos Supabase generados son inválidos o incompletos.');
  }
}

export function assertGeneratedTypesAreCurrent(
  committed: string,
  generated: string,
): void {
  assertGeneratedDatabaseTypes(committed);
  assertGeneratedDatabaseTypes(generated);

  if (
    normalizeGeneratedDatabaseTypes(committed) !==
    normalizeGeneratedDatabaseTypes(generated)
  ) {
    throw new Error(
      'Los tipos Supabase están desactualizados. Ejecuta pnpm db:types:generate.',
    );
  }
}
